"""FastAPI backend for the Multi-Agent Research System.

Endpoints:
    GET  /api/health        - health check
    POST /api/research      - SSE stream of research progress

Run:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

# ---------------------------------------------------------------------------
# Load env and make root importable
# ---------------------------------------------------------------------------
load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from models import HealthResponse, ResearchRequest  # noqa: E402
from research_stream import research_event_stream  # noqa: E402

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Multi-Agent Research System", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/research")
async def research(req: ResearchRequest) -> EventSourceResponse:
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    return EventSourceResponse(research_event_stream(req.query.strip()))


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Any, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"internal server error: {exc}"},
    )