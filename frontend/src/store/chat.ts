import { create } from "zustand";
import { streamResearch } from "@/lib/api";
import { LocalStorageStore, type Storage } from "@/lib/storage";
import { domainOf, truncate, uid } from "@/lib/utils";
import type {
  Block,
  Source,
  SourceEventData,
  StepDisplay,
  StepEventData,
  Thread,
  Theme,
} from "@/types/chat";

type SetState = (updater: (state: ChatState) => Partial<ChatState> | ChatState) => void;

const storage: Storage = new LocalStorageStore("delve");
const THREADS_KEY = "threads.v1";
const THEME_KEY = "theme.v1";

const MAX_PERSISTED_THREADS = 50;
const MAX_PERSISTED_ANSWER = 120_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function agentLabel(agent: string): string {
  return agent
    .replace(/_agent$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Turn a raw backend `step` event into the display step, or an update. */
function applyStepEvent(
  steps: StepDisplay[],
  data: StepEventData,
  chainLabel?: string,
): StepDisplay[] {
  const existing = steps.find((step) => step.id === data.step);

  if (data.status === "completed" || data.status === "tool_done") {
    if (!existing) return steps;
    return steps.map((s) =>
      s.id === data.step && s.state !== "stopped" ? { ...s, state: "done" } : s,
    );
  }

  let label: string;
  let detail: string | undefined;
  if (data.tool) {
    if (/search/i.test(data.tool)) {
      label = "Searching the web";
      if (data.input) detail = truncate(data.input.replace(/\s+/g, " "), 72);
    } else if (data.input) {
      const url = /https?:\/\/[^\s"']+(?<!["',.])/.exec(data.input)?.[0];
      const domain = url ? domainOf(url) : null;
      label = domain ? `Reading ${domain}` : "Reading source";
      if (url) detail = truncate(url.replace(/^https?:\/\//, ""), 72);
    } else {
      label = `Using ${data.tool}`;
    }
  } else if (chainLabel) {
    label = chainLabel;
  } else {
    label = `${agentLabel(data.agent)} working`;
  }

  if (existing) {
    return steps.map((s) =>
      s.id === data.step ? { ...s, label, detail: detail ?? s.detail, state: "active" } : s,
    );
  }
  return [...steps, { id: data.step, label, detail, state: "active" }];
}

/** URL fields arrive occasionally as markdown bullets ("* https://..."). */
function cleanUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^[*•-]\s*/, "")
    .replace(/[)\]}.,;'"]+$/, "");
}

function mergeSource(sources: Source[], data: SourceEventData): Source[] {
  if (!data.url) return sources;
  const url = cleanUrl(data.url);
  if (!/^https?:\/\//i.test(url)) return sources;
  if (sources.some((s) => s.id === data.id)) return sources;
  if (sources.some((s) => s.url === url)) return sources;
  return [
    ...sources,
    {
      id: data.id,
      title: data.title && data.title !== "Untitled" ? data.title : null,
      url,
      snippet: data.snippet,
      domain: data.domain,
    },
  ];
}

function patchBlock(thread: Thread, blockId: string, patch: (block: Block) => Block): Thread {
  return {
    ...thread,
    updatedAt: Date.now(),
    blocks: thread.blocks.map((block) => (block.id === blockId ? patch(block) : block)),
  };
}

function blankBlock(id: string, query: string): Block {
  return {
    id,
    query,
    steps: [],
    sources: [],
    answer: "",
    status: "streaming",
  };
}

function finalizeStopped(block: Block): Block {
  return {
    ...block,
    status: "stopped",
    steps: block.steps.map((s) => (s.state === "active" ? { ...s, state: "stopped" } : s)),
  };
}

function titleFor(query: string): string {
  return truncate(query, 60);
}

// ---------------------------------------------------------------------------
// Stream control (outside React state / persistence)
// ---------------------------------------------------------------------------

let controller: AbortController | null = null;
let streamingRef: { threadId: string; blockId: string } | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistThreads(get: () => ChatState, forced = false): void {
  const write = (): void => {
    const threads = get()
      .threads.slice(0, MAX_PERSISTED_THREADS)
      .map((thread) => ({
        ...thread,
        blocks: thread.blocks.map((block) => ({
          ...block,
          answer:
            block.answer.length > MAX_PERSISTED_ANSWER
              ? block.answer.slice(0, MAX_PERSISTED_ANSWER)
              : block.answer,
        })),
      }));
    storage.set(THREADS_KEY, threads);
    persistTimer = null;
  };
  if (forced) {
    if (persistTimer) clearTimeout(persistTimer);
    write();
  } else {
    persistTimer ??= setTimeout(write, 500);
  }
}

function flushPersist(get: () => ChatState): void {
  persistThreads(get, true);
}

/** Run the SSE pipeline, writing every event into the target block. */
function runStream(
  set: SetState,
  get: () => ChatState,
  threadId: string,
  blockId: string,
  query: string,
): void {
  const ac = new AbortController();
  controller = ac;
  streamingRef = { threadId, blockId };
  let userStopped = false;
  let chainStarts = 0;

  streamResearch({ query }, ac.signal, {
    onStep: (data) => {
      if (data.status === "running" && !data.tool) chainStarts += 1;
      const chainLabel = chainStarts <= 1 ? "Writing the report" : "Reviewing the draft";
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => {
                if (b.status !== "streaming") return b;
                return { ...b, steps: applyStepEvent(b.steps, data, chainLabel) };
              })
            : t,
        ),
      }));
      persistThreads(get);
    },
    onSource: (data) => {
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => {
                if (b.status !== "streaming") return b;
                return { ...b, sources: mergeSource(b.sources, data) };
              })
            : t,
        ),
      }));
      persistThreads(get);
    },
    onToken: (data) => {
      if (!data.text) return;
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => {
                if (b.status !== "streaming") return b;
                return { ...b, answer: b.answer + data.text };
              })
            : t,
        ),
      }));
      persistThreads(get);
    },
    onDone: (data) => {
      const report = typeof data.report === "string" && data.report.trim() ? data.report : null;
      const review =
        typeof data.feedback === "string" && data.feedback.trim() ? data.feedback : null;
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => ({
                ...b,
                status: "done",
                answer: report ?? b.answer,
                report: report ?? undefined,
                review: review ?? undefined,
              }))
            : t,
        ),
      }));
      flushPersist(get);
    },
    onError: (data) => {
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => ({
                ...finalizeStopped(b),
                status: "error",
                errorMessage: data.message ?? "The research pipeline failed.",
              }))
            : t,
        ),
      }));
      flushPersist(get);
    },
  })
    .then(() => {
      if (!userStopped) {
        // stream ended without a done/error event: treat as complete with
        // whatever was streamed
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? patchBlock(t, blockId, (b) =>
                  b.status === "streaming" ? { ...b, status: "done" } : b,
                )
              : t,
          ),
        }));
        flushPersist(get);
      }
    })
    .catch((err: unknown) => {
      const aborted = ac.signal.aborted || userStopped;
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => {
                if (aborted) return finalizeStopped(b);
                const message =
                  err instanceof Error && err.message
                    ? err.message
                    : "The research pipeline failed.";
                if (b.status === "streaming" || b.status === "stopped") {
                  return { ...finalizeStopped(b), status: "error", errorMessage: message };
                }
                return b;
              })
            : t,
        ),
      }));
      flushPersist(get);
    })
    .finally(() => {
      if (controller === ac) {
        controller = null;
        streamingRef = null;
      }
    });

  ac.signal.addEventListener(
    "abort",
    () => {
      userStopped = true;
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? patchBlock(t, blockId, (b) => (b.status === "streaming" ? finalizeStopped(b) : b))
            : t,
        ),
      }));
      flushPersist(get);
    },
    { once: true },
  );
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ChatState {
  threads: Thread[];
  activeThreadId: string | null;
  theme: Theme;
  hydrated: boolean;

  hydrate: () => void;
  setTheme: (theme: Theme) => void;

  /** Return to the landing state; the thread is created when the user sends. */
  newThread: () => void;
  setActiveThread: (threadId: string | null) => void;

  renameThread: (threadId: string, title: string) => void;
  deleteThread: (threadId: string) => void;

  /**
   * Start the research stream for a query.
   * - no options: a new thread is created (landing), or on the active thread
   *   if one is open (follow-up)
   * - blockId: regenerate that block in place
   */
  research: (
    query: string,
    opts?: { threadId?: string; blockId?: string },
  ) => { threadId: string } | null;

  setReaction: (threadId: string, blockId: string, reaction: "up" | "down" | null) => void;

  /** Abort the running request and keep the partial result. */
  stop: () => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  threads: [],
  activeThreadId: null,
  theme: "dark",
  hydrated: false,

  hydrate: () => {
    const threads = storage.get<Thread[]>(THREADS_KEY) ?? [];
    const theme = storage.get<Theme>(THEME_KEY) ?? null;
    set({ threads, hydrated: true });
    if (theme === "light" || theme === "dark") {
      set({ theme });
      document.documentElement.dataset.theme = theme;
    }
  },

  setTheme: (theme) => {
    set({ theme });
    document.documentElement.dataset.theme = theme;
    storage.set(THEME_KEY, theme);
  },

  newThread: () => {
    set({ activeThreadId: null });
  },

  setActiveThread: (threadId) => {
    set({ activeThreadId: threadId });
    const thread = get().threads.find((t) => t.id === threadId);
    document.title = thread ? `${thread.title} — Delve` : "Delve — AI research assistant";
  },

  renameThread: (threadId, title) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, title: titleFor(title.trim() || "Untitled research") } : t,
      ),
    }));
    flushPersist(get);
  },

  deleteThread: (threadId) => {
    if (controller && streamingRef?.threadId === threadId) {
      controller.abort();
      controller = null;
      streamingRef = null;
    }
    set((state) => ({
      threads: state.threads.filter((t) => t.id !== threadId),
      activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
    }));
    flushPersist(get);
  },

  research: (query, opts) => {
    const clean = query.trim();
    if (!clean) return null;
    get().stop();

    const state = get();
    let thread: Thread | undefined;
    if (opts?.threadId) {
      thread = state.threads.find((t) => t.id === opts.threadId);
    } else if (state.activeThreadId) {
      thread = state.threads.find((t) => t.id === state.activeThreadId);
    }

    const blockId = opts?.blockId ?? uid();

    if (!thread) {
      const newThread: Thread = {
        id: uid(),
        title: titleFor(clean),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: [blankBlock(blockId, clean)],
      };
      set((s) => ({
        threads: [newThread, ...s.threads],
        activeThreadId: newThread.id,
      }));
      document.title = `${titleFor(clean)} — Delve`;
      flushPersist(get);
      runStream(set, get, newThread.id, blockId, clean);
      return { threadId: newThread.id };
    }

    if (opts?.blockId) {
      // regenerate: clear the block in place, then stream again
      set((s) => ({
        threads: s.threads.map((t) =>
          t.id === thread.id ? patchBlock(t, blockId, (b) => blankBlock(b.id, b.query)) : t,
        ),
      }));
      runStream(set, get, thread.id, blockId, clean);
      return { threadId: thread.id };
    }

    // follow-up on the active thread
    const current = get().threads.find((t) => t.id === thread.id);
    if (!current) return null;
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === thread.id
          ? { ...t, updatedAt: Date.now(), blocks: [...t.blocks, blankBlock(blockId, clean)] }
          : t,
      ),
    }));
    document.title = `${titleFor(clean)} — Delve`;
    flushPersist(get);
    runStream(set, get, thread.id, blockId, clean);
    return { threadId: thread.id };
  },

  setReaction: (threadId, blockId, reaction) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? patchBlock(t, blockId, (b) => ({
              ...b,
              reaction: b.reaction === reaction ? null : reaction,
            }))
          : t,
      ),
    }));
    flushPersist(get);
  },

  stop: () => {
    if (controller) {
      controller.abort();
      controller = null;
      streamingRef = null;
    }
    set((state) => ({
      threads: state.threads.map((thread) => ({
        ...thread,
        blocks: thread.blocks.map((b) => (b.status === "streaming" ? finalizeStopped(b) : b)),
      })),
    }));
    flushPersist(get);
  },
}));
