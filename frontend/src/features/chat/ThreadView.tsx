import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { PromptInput } from "@/features/chat/PromptInput";
import { StepsTimeline } from "@/features/chat/StepsTimeline";
import { SourcesRow } from "@/features/chat/Sources";
import { SourcesPanel } from "@/features/chat/SourcesPanel";
import { AnswerBlock } from "@/features/chat/AnswerBlock";
import { SourceInteractionContext, type SourceInteraction } from "@/features/chat/interaction";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useChat } from "@/store/chat";
import type { Block, Thread } from "@/types/chat";

export function ThreadView({ thread }: ThreadViewProps): React.JSX.Element {
  const research = useChat((s) => s.research);
  const stop = useChat((s) => s.stop);

  const lastBlock = thread.blocks.at(-1);
  const streaming = lastBlock?.status === "streaming";

  const followKey = [
    thread.blocks.length,
    lastBlock?.answer.length ?? 0,
    lastBlock?.steps.length ?? 0,
    lastBlock?.sources.length ?? 0,
  ].join(":");

  const { ref, pinned, scrollToBottom, onScroll } = useAutoScroll<HTMLDivElement>(followKey);

  const submit = (query: string): void => {
    if (streaming) return;
    const result = research(query);
    if (!result?.threadId) return;
    const path = `/t/${result.threadId}`;
    if (window.location.pathname === "/") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.history.replaceState(null, "", path);
    }
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div ref={ref} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-48 pt-10 sm:px-8 md:pt-14">
          {thread.blocks.map((block, i) => (
            <ResearchBlock
              key={block.id}
              block={block}
              threadId={thread.id}
              isLast={i === thread.blocks.length - 1}
            />
          ))}
        </div>
      </div>

      {!pinned && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-[108px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-pill border border-hair-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-2 shadow-2 transition-colors hover:text-text"
          aria-label="Jump to latest"
        >
          <ArrowDown size={13} />
          Latest
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div className="h-10 bg-gradient-to-t from-bg to-transparent" />
        <div className="pointer-events-auto bg-bg pb-3 pt-2">
          <div className="mx-auto w-full max-w-[760px] px-4 sm:px-8">
            <PromptInput
              onSubmit={submit}
              streaming={streaming}
              onStop={stop}
              compact
              placeholder={
                thread.blocks.length > 1
                  ? "Ask a follow-up"
                  : "Ask a follow-up about your first question"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThreadViewProps {
  thread: Thread;
}

function ResearchBlock({
  block,
  threadId,
  isLast,
}: {
  block: Block;
  threadId: string;
  isLast: boolean;
}): React.JSX.Element {
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const interaction: SourceInteraction = {
    sources: block.sources,
    hoveredSource,
    setHoveredSource,
  };

  return (
    <SourceInteractionContext.Provider value={interaction}>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.3, 0.7, 0.3, 1] }}
        className="border-b border-hair pb-8 last:border-b-0"
      >
        <header className="mb-4">
          <h2 className="text-xl font-semibold leading-snug tracking-tight text-text sm:text-[22px]">
            {block.query}
          </h2>
        </header>
        <StepsTimeline steps={block.steps} running={block.status === "streaming"} />
        {block.sources.length > 0 && (
          <SourcesRow sources={block.sources} onOpenAll={() => setPanelOpen(true)} />
        )}
        <AnswerBlock block={block} threadId={threadId} isLast={isLast} />
      </motion.section>

      <SourcesPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </SourceInteractionContext.Provider>
  );
}
