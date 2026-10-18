# Multi-Agent Research System

<img src="assets/banner.png" alt="Multi-Agent Research System banner" width="1000" />

A full-stack, multi-agent research assistant: search the web, scrape sources, draft a cited report, and get a critic's review — streamed token-by-token through SSE, Perplexity-style.

[🧪 Try the demo](http://localhost:5173) · [📖 API docs](http://127.0.0.1:8000/docs)

---

## The Problem

Web research today is copy-paste assembly line work:

1. Paste a query into a search engine.
2. Open five results, skim each one, hunt for the relevant paragraph.
3. Open a blank doc and synthesize by hand, losing track of where each claim came from.
4. Repeat for every follow-up question.

**This system** automates the loop. You ask a question in plain language; a team of agents searches, reads, writes, and critiques — surfacing the sources behind every claim so you can verify instead of trust.

---

## What We Built

An agentic research pipeline wired end-to-end, FastAPI backend + React frontend:

| Component | Role | Backed by |
|---|---|---|
| **Search agent** | Formulates queries and runs Tavily web search | `agents.py` `build_search_agent()` |
| **Reader agent** | Picks the most relevant result and scrapes it via BeautifulSoup | `agents.py` `build_reader_agent()` |
| **Writer chain** | Drafts a structured report with inline `[n]` citation tags | LangChain `ChatPromptTemplate` stream |
| **Critic chain** | Reviews the draft and emits structured feedback | LangChain stream (collapsed "Review" card) |
| **Frontend** | Thread view, live steps timeline, sources panel, citation chips | React 18 + Vite + Zustand + Framer Motion |

The shared LLM is provider-switched via `.env`: **Groq** by default; set a real `GEMINI_API_KEY` to use **Gemini 2.5 Flash** instead (bigger free daily token budget).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, FastAPI, Uvicorn, sse-starlette, LangChain, LangGraph, Tavily, BeautifulSoup, python-dotenv |
| **LLM** | ChatGroq (default) / ChatGoogleGenerativeAI (optional via `GEMINI_API_KEY`) |
| **Frontend** | React 18, Vite 6, TypeScript strict, Zustand, Framer Motion, Tailwind v4 (CSS variables + `data-theme`) |
| **Markdown** | react-markdown + remark-gfm + rehype-highlight, citation-chip regex `[n]` → source cards |
| **State** | LocalStorage-persisted threads/blocks; per-block steps, sources, answer, review, reactions |

---

## How It Works — Pipeline Flowchart

```mermaid
flowchart TD
    A[User types a research question<br/>frontend /t/:threadId] --> B[POST /api/research<br/>SSE stream opens]
    B --> C[Search agent<br/>Tavily web search]
    C --> D[Sources parsed & numbered [1]…[n]<br/>emitted as source events]
    D --> E[Reader agent<br/>scrapes top source via BeautifulSoup]
    E --> F[Writer chain streams report tokens<br/>with [n] citation tags]
    F --> G[Critic chain streams review feedback]
    G --> H[done event → report + review saved]
    H --> I[Frontend renders:<br/>steps timeline, sources panel,<br/>answer markdown with chips, Review card]
```

Events flow over `text/event-stream`: `step` → `source` → `token` → `done` (or `error`). No simulated events — every UI beat is a real agent event.

---

## Project Structure

```
Multi-Agent Research System/
├── README.md
├── agents.py            # LangChain agents + writer/critic chains + LLM provider switch
├── tools.py             # Tavily web_search + BeautifulSoup scrape_url
├── pipeline.py          # Existing research pipeline entry point
├── requirements.txt     # Python deps (incl. langchain-google-genai)
├── .env                 # GROQ_API_KEY, TAVILY_API_KEY, [GEMINI_API_KEY]
├── .env.example         # copy this to .env and fill in real keys
├── backend/
│   ├── main.py          # FastAPI app, CORS, GET /api/health, POST /api/research
│   ├── models.py        # Pydantic request/response models
│   ├── research_stream.py # SSE wrapper: queues agent events, yields wire-correct frames
│   └── requirements.txt
└── frontend/
    ├── index.html       # theme init script + meta tags
    ├── .env             # VITE_API_BASE=http://127.0.0.1:8000
    ├── .env.example
    ├── package.json
    ├── src/
    │   ├── lib/{api,sse,storage,router,utils}.ts   # SSE parser, typed client, localStorage
    │   ├── store/chat.ts      # Zustand: threads, blocks, streaming orchestration
    │   ├── styles/{tokens,index}.css   # dark/light design tokens, @theme mapping
    │   ├── components/Markdown.tsx, Favicon.tsx, Tooltip.tsx, Toaster.tsx, IconButton.tsx
    │   ├── features/chat/   # Landing, ThreadView, AppShell, PromptInput, StepsTimeline,
    │   │                    Sources, SourcesPanel, AnswerBlock, ReviewBlock, Citations…
    │   └── hooks/           # useAutoScroll, useOnline, useBackendHealth
    └── public/favicon.svg
```

---

## Quick Start

### Prerequisites

- Python 3.10+ with `uv` (or `venv` + `pip`)
- Node.js 18+ with npm
- API keys: [Groq](https://console.groq.com/), [Tavily](https://app.tavily.com/)
- Optional: [Google AI Studio](https://aistudio.google.com/apikey) for Gemini instead of Groq

### 1. Backend

```bash
cd "/home/aditya/Desktop/Multi-Agent Research System"

# Create venv (uv is fastest)
uv venv venv
source venv/bin/activate   # or: venv\Scripts\activate  (Windows)

# Install deps
uv pip install -r backend/requirements.txt
uv pip install -r requirements.txt   # root deps incl. langchain-google-genai

# Configure environment
cp .env.example .env
# Edit .env: GROQ_API_KEY, TAVILY_API_KEY (required); GEMINI_API_KEY (optional)

# Start the backend
uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir backend
```

Verify:

```bash
curl http://127.0.0.1:8000/api/health
# → {"status":"ok"}
```

Backend runs at `http://127.0.0.1:8000`; interactive docs at `/docs`.

### 2. Frontend

```bash
cd "/home/aditya/Desktop/Multi-Agent Research System/frontend"

# Install deps
npm install

# Start dev server (Vite on :5173, proxies to :8000 via VITE_API_BASE)
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 3. Use the app

Open `http://localhost:5173`, enter a research topic, and watch the agents work in real time:

- **Steps timeline** pulses as search/read/write/critic progress
- **Sources row** fills with numbered cards (favicon + domain + title)
- **Answer** streams in with `[1]`, `[2]`… citation chips that highlight the matching source card on hover
- **Review card** (collapsed) shows the critic's feedback once the draft is done
- **Follow-up input** appends a new block to the same thread; threads persist in `localStorage`

---

## Environment Variables

Root `.env` (read by `agents.py`, `backend/main.py`):

| Variable | Required | Example | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | yes (unless Gemini) | `gsk_…` | Default LLM provider |
| `TAVILY_API_KEY` | yes | `tvly-dev-…` | Web search tool |
| `GEMINI_API_KEY` | optional | `AIza…` | When set to a real key, Gemini 2.5 Flash is used instead of Groq |

Frontend `frontend/.env`:

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_BASE` | `http://127.0.0.1:8000` | Backend origin; empty = same origin |

Copy `.env.example` files and fill in real values — never commit secrets.

---

## Design Notes

- **Dark theme by default** (`#0B1514` / `#111C1B`, accent `#20B8CD`), light theme (`#FBFAF4`, accent `#1495A8`), switched via `data-theme` and persisted as `delve.theme.v1`.
- **Themed UI tokens**: CSS variables mapped to Tailwind utilities (`@theme inline`); `font-answer` (serif) for report prose, `scroll-fade-right` for the sources carousel, `caret-blink` for streaming.
- **Citations**: writer emits `[n]` tags; frontend regex-wraps them into chips; hovering a chip highlights the corresponding source card via a per-block interaction context.
- **Multiple blocks per thread**: each query is a `Block`; follow-ups append blocks so a thread is a research session, not a single turn.
- **Stop mid-stream**: abort keeps the partial answer and shows "Continue researching" to retry the same block.
- **Reduced motion**: all pulsing/spinner animations respect `prefers-reduced-motion`.

---

## API Reference

### `GET /api/health`
Health check → `{"status": "ok"}`.

### `POST /api/research`
Body: `{"query": "string"}`. Returns `text/event-stream` (SSE).

| Event | Payload | Meaning |
|---|---|---|
| `step` | `{step, agent, tool?, status, message, input?}` | Agent/tool lifecycle: `running`/`calling`/`completed`/`tool_done` |
| `source` | `{id, title, url, snippet?, domain?}` | Discovered source (URLs sanitized, `Untitled` → null) |
| `token` | `{text}` | Streamed writer/critic text |
| `done` | `{report, feedback}` | Pipeline complete; critic feedback may be null |
| `error` | `{message}` | Pipeline failure (e.g. rate limit) |

Example:

```bash
curl -N -X POST http://127.0.0.1:8000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"What is RAG?"}'
```

### Known limits
Groq's free tier caps ~200k tokens/day; if a run hits a 429, the frontend shows an error banner with Retry. Set `GEMINI_API_KEY` in `.env` to switch providers, or wait for the daily window to reset.

---

## Roadmap

- [ ] Regenerate a single block in place (keeping siblings)
- [ ] Rename/delete threads from the sidebar (UI wired, persistence done)
- [ ] Export thread as Markdown/PDF
- [ ] Per-block source quality scoring

---

## License

MIT License. See `LICENSE`.
