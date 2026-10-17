"""
Research pipeline wrapper that streams real agent events via SSE.

Reuses the existing agent components (build_search_agent, build_reader_agent,
writer_chain, critic_chain) from agents.py without rewriting their logic.
Blocking tool calls run in a thread executor so the FastAPI event loop stays
free. LangChain callback handlers emit step / source / token events.
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, AsyncGenerator, Optional

from fastapi.responses import StreamingResponse
from langchain_core.callbacks.base import BaseCallbackHandler
from sse_starlette.sse import EventSourceResponse

# ---------------------------------------------------------------------------
# Make the root package (agents.py, tools.py, pipeline.py) importable
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agents import (  # noqa: E402
    build_search_agent,
    build_reader_agent,
    writer_chain,
    critic_chain,
)

# ---------------------------------------------------------------------------
# Executor for blocking tool / agent calls
# ---------------------------------------------------------------------------
_executor = ThreadPoolExecutor(max_workers=2)


def _parse_domain(url: str) -> str:
    try:
        host = url.split("//", 1)[1].split("/", 1)[0]
        host = host.split("?", 1)[0]
        # Strip leading www.
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return ""


def _parse_search_sources(text: str) -> list[dict[str, str | None]]:
    """
    Parse Tavily-formatted search output into structured source dicts.

    Expected format (from tools.py web_search):
        Title: <title>
        URL: <url>
        Snippet: <snippet>\r

        -----
    """
    sources: list[dict[str, str | None]] = []
    blocks = re.split(r"\n----\n", text)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        title_match = re.search(r"Title:\s*(.+)", block)
        url_match = re.search(r"URL:\s*(.+)", block)
        snippet_match = re.search(r"Snippet:\s*(.+)", block, re.DOTALL)
        title = title_match.group(1).strip() if title_match else None
        url = url_match.group(1).strip() if url_match else None
        snippet = snippet_match.group(1).strip() if snippet_match else None
        if url:
            sources.append(
                {
                    "title": title or "Untitled",
                    "url": url,
                    "snippet": snippet,
                    "domain": _parse_domain(url) if url else None,
                }
            )
    return sources


# ---------------------------------------------------------------------------
# LangChain callback handler -> emits SSE events
# ---------------------------------------------------------------------------
class ResearchCallbackHandler(BaseCallbackHandler):
    """Synchronous callback handler that pushes events into a thread-safe queue."""

    def __init__(self, event_queue: "queue.Queue[str]"):
        import queue

        self.event_queue = event_queue
        self._step = 0
        self._source_id = 0

    def _emit(self, event_type: str, data: dict[str, Any]) -> None:
        self.event_queue.put_nowait(json.dumps({"event": event_type, "data": data}))

    # -- chain lifecycle -----------------------------------------------------
    def on_chain_start(self, serialized: dict[str, Any], inputs: dict[str, Any], **kwargs: Any) -> None:
        name = serialized.get("name", "chain")
        self._step += 1
        self._emit(
            "step",
            {
                "step": self._step,
                "agent": name,
                "status": "running",
                "message": f"{name} started",
            },
        )

    def on_chain_end(self, outputs: dict[str, Any], **kwargs: Any) -> None:
        self._emit("step", {"step": self._step, "status": "completed"})

    # -- tool lifecycle ------------------------------------------------------
    def on_tool_start(
        self,
        serialized: dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> None:
        name = serialized.get("name", "tool")
        self._step += 1
        agent = "search_agent" if "search" in name.lower() else "reader_agent"
        self._emit(
            "step",
            {
                "step": self._step,
                "agent": agent,
                "tool": name,
                "status": "calling",
                "message": f"{agent} calling {name}",
                "input": input_str[:200],
            },
        )

    def on_tool_end(self, output: Any, **kwargs: Any) -> None:
        self._emit("step", {"step": self._step, "status": "tool_done"})
        if isinstance(output, str):
            sources = _parse_search_sources(output)
            for src in sources:
                self._source_id += 1
                self._emit(
                    "source",
                    {
                        "id": self._source_id,
                        "title": src.get("title"),
                        "url": src.get("url"),
                        "snippet": src.get("snippet"),
                        "domain": src.get("domain"),
                    },
                )

    # -- LLM token streaming -------------------------------------------------
    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        self._emit("token", {"text": token})


# ---------------------------------------------------------------------------
# Async generator that runs the pipeline and yields SSE events
# ---------------------------------------------------------------------------
async def research_event_stream(query: str) -> AsyncGenerator[dict[str, Any], None]:
    """
    Run the full research pipeline and yield SSE-compatible events.

    Events emitted:
        step   - agent/tool is running or completed
        source - a discovered source (title, url, snippet, domain)
        token  - partial LLM text from writer / critic chains
        done   - pipeline finished
        error  - something went wrong
    """
    import queue

    event_queue: "queue.Queue[str]" = queue.Queue()
    handler = ResearchCallbackHandler(event_queue)

    def _run_blocking() -> None:
        """Execute the pipeline synchronously in a worker thread."""
        try:
            # ---- Step 1: Search agent -------------------------------------
            search_agent = build_search_agent()
            search_result = search_agent.invoke(
                {
                    "messages": [
                        (
                            "user",
                            f"Find recent, reliable and detailed information about: {query}",
                        )
                    ]
                },
                config={"callbacks": [handler]},
            )
            search_text = search_result["messages"][-1].content

            # Emit parsed sources from search
            sources = _parse_search_sources(search_text)
            for src in sources:
                handler._source_id += 1
                handler._emit(
                    "source",
                    {
                        "id": handler._source_id,
                        "title": src.get("title"),
                        "url": src.get("url"),
                        "snippet": src.get("snippet"),
                        "domain": src.get("domain"),
                    },
                )

            # ---- Step 2: Reader agent -------------------------------------
            reader_agent = build_reader_agent()
            reader_result = reader_agent.invoke(
                {
                    "messages": [
                        (
                            "user",
                            f"Based on the following search results about '{query}', "
                            f"pick the most relevant URL and scrape it for deeper content.\n\n"
                            f"Search Results:\n{search_text[:800]}",
                        )
                    ]
                },
                config={"callbacks": [handler]},
            )
            scraped_content = reader_result["messages"][-1].content

            # ---- Step 3: Writer chain (streaming tokens) ------------------
            research_combined = (
                f"SEARCH RESULTS : \n{search_text}"
                f"\nDETAILED SCRAPED CONTENT: \n{scraped_content}"
            )
            report_parts: list[str] = []
            for chunk in writer_chain.stream(
                {"topic": query, "research": research_combined},
                config={"callbacks": [handler]},
            ):
                report_parts.append(chunk)
                handler._emit("token", {"text": chunk})
            report = "".join(report_parts)

            # ---- Step 4: Critic chain (streaming tokens) ------------------
            feedback_parts: list[str] = []
            for chunk in critic_chain.stream(
                {"report": report},
                config={"callbacks": [handler]},
            ):
                feedback_parts.append(chunk)
                handler._emit("token", {"text": chunk})

            handler._emit("done", {"report": report, "feedback": "".join(feedback_parts)})

        except Exception as exc:  # noqa: BLE001
            handler._emit("error", {"message": str(exc)})
        finally:
            # Sentinel to tell the consumer we are finished
            event_queue.put_nowait("__SENTINEL__")

    # Start the blocking pipeline in a thread
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(_executor, _run_blocking)

    # Yield events from the queue until the sentinel arrives
    while True:
        try:
            item = await asyncio.wait_for(
                loop.run_in_executor(None, event_queue.get), timeout=30.0
            )
        except asyncio.TimeoutError:
            yield {"event": "error", "data": json.dumps({"message": "stream timed out"})}
            return

        if item == "__SENTINEL__":
            return

        parsed = json.loads(item)
        yield parsed


# ---------------------------------------------------------------------------
# FastAPI route factory
# ---------------------------------------------------------------------------
def research_route(query: str) -> StreamingResponse:
    return EventSourceResponse(research_event_stream(query))