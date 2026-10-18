/**
 * Minimal SSE reader built on fetch + ReadableStream.
 *
 * Handles standard `event:` / `data:` frames and also accepts frames where
 * the payload is a single JSON object that itself contains {event, data}
 * (the shape sse-starlette can produce). Yields parsed events.
 */

export interface SseMessage {
  event: string;
  data: string;
}

export interface ParsedSseEvent {
  event: string;
  data: unknown;
}

const MAX_LINE = 100_000;

export async function readSse(
  response: Response,
  onEvent: (msg: ParsedSseEvent) => void,
): Promise<void> {
  const body = response.body;
  if (!body) throw new Error("stream has no body");

  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let message: Partial<SseMessage> = { event: "message" };
  let dataLines: string[] = [];

  const flush = (): void => {
    if (dataLines.length === 0 && !message.event) return;
    const data = dataLines.join("\n");
    if (!data) {
      message = { event: "message" };
      dataLines = [];
      return;
    }
    // try nested {event, data} payloads first
    try {
      const parsed: unknown = JSON.parse(data);
      if (parsed && typeof parsed === "object" && "event" in parsed && "data" in parsed) {
        const nested = parsed as { event: string; data: unknown };
        onEvent({ event: nested.event, data: nested.data });
        message = { event: "message" };
        dataLines = [];
        return;
      }
    } catch {
      // not JSON: fall through with the raw string
    }
    onEvent({
      event: message.event && message.event !== "message" ? message.event : "message",
      data,
    });
    message = { event: "message" };
    dataLines = [];
  };

  const handleLine = (line: string): void => {
    if (line.length > MAX_LINE) return;
    if (line === "" || line === "\r") {
      flush();
      return;
    }
    if (line.startsWith(":")) return; // comment/keep-alive
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") {
      message.event = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
    // id / retry fields not used by this API
  };

  for (let result = await reader.read(); !result.done; result = await reader.read()) {
    buffer += decoder.decode(result.value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      handleLine(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  // flush what may remain without a trailing newline
  if (buffer) handleLine(buffer);
  flush();
  decoder.decode();
}

export class SseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SseError";
  }
}
