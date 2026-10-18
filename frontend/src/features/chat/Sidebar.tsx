import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Check,
  Menu,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useChat } from "@/store/chat";
import { groupThreads, cn } from "@/lib/utils";
import { Tip } from "@/components/Tooltip";
import type { Thread } from "@/types/chat";

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps): React.JSX.Element | null {
  if (collapsed) return null;
  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 border-r border-hair bg-surface md:block md:w-[264px]">
      <div className="flex h-full w-[264px] flex-col">
        <SidebarContent onCollapse={onCollapse} />
      </div>
    </aside>
  );
}

function MobileSidebar(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const openSidebar = (): void => setOpen(true);
    window.addEventListener("delve:open-sidebar", openSidebar);
    return () => window.removeEventListener("delve:open-sidebar", openSidebar);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px]" />
        <Dialog.Content className="drawer-slide-in fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-hair bg-surface shadow-2 outline-none">
          <Dialog.Title className="sr-only">Research history</Dialog.Title>
          <Dialog.Description className="sr-only">Previous research threads</Dialog.Description>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 rounded-full p-2 text-text-2 hover:bg-surface-3"
          >
            <X size={16} />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { MobileSidebar };

/** Opens the mobile drawer; wired via DOM event to avoid prop-drilling. */
export function openMobileSidebar(): void {
  window.dispatchEvent(new Event("delve:open-sidebar"));
}

function SidebarContent({
  onCollapse,
  onNavigate,
}: {
  onCollapse?: () => void;
  onNavigate?: () => void;
}): React.JSX.Element {
  const threads = useChat((s) => s.threads);
  const activeThreadId = useChat((s) => s.activeThreadId);
  const theme = useChat((s) => s.theme);
  const setTheme = useChat((s) => s.setTheme);
  const setActiveThread = useChat((s) => s.setActiveThread);
  const renameThread = useChat((s) => s.renameThread);
  const deleteThread = useChat((s) => s.deleteThread);

  const choose = (threadId: string): void => {
    setActiveThread(threadId);
    navigateToThread(threadId);
    onNavigate?.();
  };

  const groups = groupThreads(threads);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-1 pt-3.5">
        <button
          type="button"
          onClick={() => {
            useChat.getState().newThread();
            navigateToLanding();
            onNavigate?.();
          }}
          className="flex items-center gap-2 rounded-pill px-2 py-1.5 text-left transition-colors hover:bg-surface-3"
          aria-label="Delve home, start a new research thread"
        >
          <LogoMark className="h-6 w-6" />
          <span className="text-[15px] font-semibold tracking-tight text-text">Delve</span>
        </button>
        {typeof onCollapse === "function" && (
          <Tip label="Hide sidebar">
            <button
              onClick={onCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface-3 hover:text-text"
              aria-label="Hide sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </Tip>
        )}
      </div>

      <div className="px-3 py-2">
        <button
          onClick={() => {
            useChat.getState().newThread();
            navigateToLanding();
            onNavigate?.();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-hair bg-bg px-3 py-2 text-sm font-medium text-text transition-colors hover:border-hair-strong hover:bg-surface-2"
        >
          <Plus size={15} className="text-accent" />
          New research
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2" aria-label="Research history">
        {groups.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Sparkles size={18} className="mx-auto mb-2 text-text-3" />
            <p className="text-[13px] leading-relaxed text-text-2">
              No research yet.
              <br />
              Ask a question to start your first thread.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.group} className="mb-3">
              <h3 className="px-2.5 pb-1 text-[11px] font-medium text-text-3">{group.group}</h3>
              <ul>
                {group.threads.map((thread) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    active={thread.id === activeThreadId}
                    onChoose={() => choose(thread.id)}
                    onRename={(title) => renameThread(thread.id, title)}
                    onDelete={() => deleteThread(thread.id)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      <div className="border-t border-hair px-3 py-2">
        <Tip label={theme === "dark" ? "Switch to light" : "Switch to dark"}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-text-2 transition-colors hover:bg-surface-3 hover:text-text"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
        </Tip>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  onChoose,
  onRename,
  onDelete,
}: {
  thread: Thread;
  active: boolean;
  onChoose: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}): React.JSX.Element {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(thread.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const streaming = thread.blocks.some((b) => b.status === "streaming");

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const commit = (): void => {
    onRename(draft);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <li className="px-1.5">
        <div className="flex items-center gap-1 rounded-lg border border-accent/50 bg-bg px-2 py-1.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(thread.title);
                setRenaming(false);
              }
            }}
            aria-label="Rename thread"
            className="w-full min-w-0 bg-transparent text-[13px] text-text outline-none"
          />
          <button
            aria-label="Save title"
            onClick={commit}
            className="shrink-0 p-0.5 text-text-2 hover:text-text"
          >
            <Check size={14} />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div
        className={cn(
          "group relative flex w-full items-center rounded-lg transition-colors duration-[var(--dur-fast)]",
          active ? "bg-surface-3 text-text" : "text-text-2 hover:bg-surface-3/60 hover:text-text",
        )}
      >
        <button
          onClick={onChoose}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-2.5 pr-1 text-left"
          title={thread.title}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              streaming
                ? "bg-accent motion-safe-pulse"
                : active
                  ? "bg-accent/70"
                  : "bg-hair-strong",
            )}
          />
          <span className="truncate text-[13px] leading-tight">{thread.title}</span>
        </button>
        <div
          className={cn(
            "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
          )}
        >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                aria-label={`Options for ${thread.title}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-2 hover:text-text"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-dialog border border-hair bg-surface-2 p-1 shadow-2"
              >
                <DropdownMenu.Item
                  onSelect={() => setRenaming(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-text outline-none data-[highlighted]:bg-surface-3"
                >
                  <Pencil size={13} /> Rename
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={onDelete}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-danger outline-none data-[highlighted]:bg-danger-soft"
                >
                  <Trash2 size={13} /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </li>
  );
}

export function LogoMark({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" width="70%" height="70%" aria-hidden>
        <path
          d="M12 3c.6 0 .9 4.4 1.3 5 .3.7 1.7 1 2.2 1.5.6.5.7 2 1.3 2.3.6.3 2.9 1.5 2.9 2.1 0 1-4.6 1-5.2 1.4-.6.3-.8 1.8-1.3 2.4-.4.4-1.8.3-2.4.3-1 0-1.3-3.3-1.6-3.7-.3-.6-1.6-.2-2.1-.7-.6-.6-.6-2.1-.6-2.8 0-.6 3-1 3.6-1.4.5-.4 1.3-1.8 1.9-1.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// navigation helpers kept tiny to avoid a router dependency in the store
export function navigateToThread(threadId: string): void {
  window.history.pushState(null, "", `/t/${threadId}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigateToLanding(): void {
  window.history.pushState(null, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function MobileMenuButton({ className }: { className?: string }): React.JSX.Element {
  return (
    <button
      onClick={openMobileSidebar}
      aria-label="Open history"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface-3 hover:text-text",
        className,
      )}
    >
      <Menu size={18} />
    </button>
  );
}
