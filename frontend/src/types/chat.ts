// ---------------------------------------------------------------------------
// SSE event shapes (matches backend research_stream.py)
// ---------------------------------------------------------------------------

export type StepStatus = "running" | "calling" | "completed" | "tool_done";

export interface StepEventData {
  step: number;
  agent: string;
  tool?: string | null;
  status: StepStatus;
  message?: string;
  input?: string;
}

export interface TokenEventData {
  text: string;
}

export interface SourceEventData {
  id: number;
  title: string | null;
  url: string | null;
  snippet?: string | null;
  domain?: string | null;
}

export interface DoneEventData {
  report?: string;
  feedback?: string;
}

export interface ErrorEventData {
  message?: string;
}

export interface ResearchRequest {
  query: string;
}

// ---------------------------------------------------------------------------
// Domain model (frontend-side, persisted)
// ---------------------------------------------------------------------------

export type StepState = "active" | "done" | "stopped";

export interface StepDisplay {
  id: number;
  label: string;
  detail?: string;
  state: StepState;
}

export interface Source {
  id: number;
  title: string | null;
  url: string;
  snippet?: string | null;
  domain?: string | null;
}

/** One research run (its own query, steps, sources and answer). */
export interface Block {
  id: string;
  query: string;
  steps: StepDisplay[];
  sources: Source[];
  /** Live stream buffer while running; replaced by `report` when done. */
  answer: string;
  /** Report as split out by the backend `done` event. */
  report?: string;
  /** Critic-agent review from the `done` event. */
  review?: string;
  /** User reaction on the answer footer. */
  reaction?: "up" | "down" | null;
  status: "streaming" | "done" | "error" | "stopped";
  errorMessage?: string;
}

export interface Thread {
  id: string;
  /** First block's query, used everywhere a title is shown. */
  title: string;
  createdAt: number;
  updatedAt: number;
  blocks: Block[];
}

export type Theme = "dark" | "light";
