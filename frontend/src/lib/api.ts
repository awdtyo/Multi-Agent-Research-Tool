/**
 * Typed API client for the FastAPI backend.
 *
 * Base URL comes from VITE_API_BASE (see .env.example). All requests go
 * through here; streams use fetch + ReadableStream with AbortController.
 */

import { readSse, type ParsedSseEvent } from "@/lib/sse";
import type {
  DoneEventData,
  ErrorEventData,
  ResearchRequest,
  SourceEventData,
  StepEventData,
  TokenEventData,
} from "@/types/chat";

const BASE_URL: string = import.meta.env.VITE_API_BASE ?? "";

export function apiUrl(path: string): string {
  const base = BASE_URL.replace(/\/+$/, "");
  return `${base}${path}`;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function healthCheck(signal?: AbortSignal): Promise<boolean> {
  const response = await fetch(apiUrl("/api/health"), { signal, method: "GET" });
  if (!response.ok) throw new ApiError("health check failed", response.status);
  return true;
}

export type ResearchEvent =
  | { type: "step"; data: StepEventData }
  | { type: "source"; data: SourceEventData }
  | { type: "token"; data: TokenEventData }
  | { type: "done"; data: DoneEventData }
  | { type: "error"; data: ErrorEventData };

export interface StreamHandlers {
  onStep?: (data: StepEventData) => void;
  onSource?: (data: SourceEventData) => void;
  onToken?: (data: TokenEventData) => void;
  onDone?: (data: DoneEventData) => void;
  onError?: (data: ErrorEventData) => void;
}

/**
 * POST /api/research and dispatch the SSE stream.
 *
 * Resolves once the stream ends. Throws if the initial POST fails or the
 * request is aborted; the `aborted` flag distinguishes a user stop.
 */
export async function streamResearch(
  request: ResearchRequest,
  signal: AbortSignal,
  handlers: StreamHandlers,
  opts?: { aborted?: () => boolean },
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/api/research"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (err) {
    if (signal.aborted || opts?.aborted?.()) throw err; // user stop
    throw new ApiError("Could not reach the research backend. Check that it is running.");
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "detail" in body) {
        detail = String(body.detail);
      }
    } catch {
      // non-JSON body
    }
    throw new ApiError(detail, response.status);
  }

  const routeEvent = (msg: ParsedSseEvent) => {
    const data: unknown = typeof msg.data === "string" ? safeParse(msg.data) : msg.data;
    switch (msg.event) {
      case "step":
        handlers.onStep?.(data as StepEventData);
        break;
      case "source":
        handlers.onSource?.(data as SourceEventData);
        break;
      case "token":
        handlers.onToken?.(data as TokenEventData);
        break;
      case "done":
        handlers.onDone?.(data as DoneEventData);
        break;
      case "error":
        handlers.onError?.(data as ErrorEventData);
        break;
      default:
        break;
    }
  };

  await readSse(response, routeEvent);

  if (signal.aborted || opts?.aborted?.()) throw new DOMException("aborted", "AbortError");
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
