import { useEffect, useState } from "react";
import { PanelLeftOpen, TriangleAlert, WifiOff, RefreshCw, X } from "lucide-react";
import { useRoute } from "@/lib/router";
import { useOnline } from "@/hooks/useOnline";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useChat } from "@/store/chat";
import { Sidebar, MobileMenuButton, MobileSidebar } from "@/features/chat/Sidebar";
import { Landing } from "@/features/chat/Landing";
import { ThreadView } from "@/features/chat/ThreadView";
import { NotFound } from "@/features/chat/NotFound";
import { TooltipProvider } from "@/components/Tooltip";
import { Toaster } from "@/components/Toaster";

const SIDEBAR_KEY = "delve.sidebar.v1";

function goHome(): void {
  window.history.pushState(null, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function AppShell(): React.JSX.Element {
  const route = useRoute();
  const online = useOnline();
  const { health, recheck } = useBackendHealth();
  const hydrated = useChat((s) => s.hydrated);
  const hydrate = useChat((s) => s.hydrate);
  const threads = useChat((s) => s.threads);
  const stop = useChat((s) => s.stop);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(SIDEBAR_KEY) ?? "false") as boolean;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  // global hotkeys: Cmd/Ctrl+K new thread, Esc stop
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        goHome();
        useChat.getState().newThread();
      }
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  // hide thread content when navigating to a deleted/unknown thread
  const thread = route.threadId ? threads.find((t) => t.id === route.threadId) : undefined;

  const streaming = threads.some((t) => t.blocks.some((b) => b.status === "streaming"));

  return (
    <TooltipProvider>
      <div className="flex h-dvh bg-bg text-text">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(true)} />
        <MobileSidebar />
        <main className="relative flex min-w-0 flex-1 flex-col">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Show sidebar"
              className="absolute left-2 top-2 z-30 flex h-9 w-9 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface-3 hover:text-text"
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
          <div className="flex h-11 shrink-0 items-center gap-1 px-2 md:hidden">
            <MobileMenuButton />
          </div>
          {health === "down" && <HealthBanner onRecheck={recheck} />}
          {!online && <OfflineBanner />}
          <div className="flex min-h-0 flex-1 flex-col">
            {route.name === "thread" &&
              (thread ? (
                <ThreadView thread={thread} />
              ) : (
                <NotFound message="No research with this title — it may have been deleted." />
              ))}
            {route.name === "not-found" && <NotFound message="This page doesn't exist." />}
            {route.name === "landing" && (
              <Landing
                onSubmit={(query) => {
                  const result = useChat.getState().research(query);
                  if (result?.threadId) {
                    window.history.pushState(null, "", `/t/${result.threadId}`);
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }
                }}
                streaming={streaming}
                onStop={stop}
              />
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function HealthBanner({ onRecheck }: { onRecheck: () => void }): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="mx-2 mb-2 flex shrink-0 items-center gap-2 rounded-card border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-text">
      <TriangleAlert size={15} className="shrink-0 text-danger" />
      <span className="min-w-0 flex-1">
        Backend unreachable — start it with{" "}
        <code className="rounded bg-surface-3 px-1 py-0.5 text-xs">
          uvicorn main:app --reload --port 8000
        </code>{" "}
        from the repo root.
      </span>
      <button
        onClick={onRecheck}
        className="flex shrink-0 items-center gap-1 rounded-card px-2 py-1 text-xs font-medium text-text-2 hover:text-text"
      >
        <RefreshCw size={12} /> Retry
      </button>
      <button
        aria-label="Dismiss"
        className="shrink-0 text-text-3 hover:text-text-2"
        onClick={() => setDismissed(true)}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function OfflineBanner(): React.JSX.Element {
  return (
    <div className="mb-2 flex shrink-0 items-center gap-2 rounded-card border border-hair bg-surface-2 px-3 py-2 text-[13px] text-text-2">
      <WifiOff size={14} className="shrink-0" />
      <span className="min-w-0 flex-1">
        You're offline — network results are unavailable until you reconnect.
      </span>
    </div>
  );
}
