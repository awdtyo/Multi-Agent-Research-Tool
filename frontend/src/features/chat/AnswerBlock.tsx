import { useState } from "react";
import {
  Check,
  ClipboardCopy,
  Link2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  OctagonPause,
} from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { PillButton } from "@/components/IconButton";
import { useSourceInteraction } from "@/features/chat/interaction";
import { ReviewBlock } from "@/features/chat/ReviewBlock";
import { AnswerSkeleton } from "@/features/chat/AnswerSkeleton";
import { showToast } from "@/components/Toaster";
import { useChat } from "@/store/chat";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/chat";

interface AnswerBlockProps {
  block: Block;
  threadId: string;
  isLast: boolean;
}

/**
 * The streamed answer for one block: skeleton while waiting, markdown with
 * citation chips while streaming, review block + footer actions when done.
 */
export function AnswerBlock({
  block,
  threadId,
  isLast,
}: AnswerBlockProps): React.JSX.Element | null {
  const { sources } = useSourceInteraction();
  const setReaction = useChat((s) => s.setReaction);
  const [copied, setCopied] = useState(false);

  const streaming = block.status === "streaming";
  const hasText = block.answer.trim().length > 0;
  const sourcesFailed = block.status === "done" && sources.length === 0;

  // before the first tokens land (agents still searching/scraping):
  // breathing skeleton
  if (streaming && !hasText) {
    return <AnswerSkeleton />;
  }

  // no content ever arrived: offer a retry instead of a stuck skeleton
  if (!streaming && !hasText && block.status !== "error") {
    return block.status === "done" ? (
      <ErrorBanner
        message="The research pipeline returned no report. Give it another try."
        onRetry={() => useChat.getState().research(block.query, { threadId, blockId: block.id })}
      />
    ) : (
      <AnswerSkeleton />
    );
  }

  if (block.status === "error") {
    return (
      <ErrorBanner
        message={block.errorMessage ?? "The research pipeline failed."}
        onRetry={() => useChat.getState().research(block.query, { threadId, blockId: block.id })}
      />
    );
  }

  const copyAnswer = (): void => {
    void navigator.clipboard
      .writeText(block.report ?? block.answer)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => showToast("Clipboard unavailable"));
  };

  const shareLink = (): void => {
    const url = window.location.href;
    void navigator.clipboard.writeText(url).then(() => showToast("Link copied"));
  };

  return (
    <article className="pb-2">
      {sourcesFailed && (
        <div className="mb-4 rounded-dialog border border-hair bg-surface-2 px-3.5 py-2.5 text-[13px] text-text-2">
          The agents found no web sources for this query — treat the answer accordingly.
        </div>
      )}

      <div className={cn("text-text", isLast && streaming && "will-change-contents")}>
        <Markdown text={block.answer} />
        <StreamingCaret enabled={isLast && streaming} />
      </div>

      <ReviewBlock review={block.review} visible={block.status === "done"} />

      {!streaming && hasText && (
        <div className="mt-4 flex flex-wrap items-center gap-1">
          <PillButton
            icon={copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
            onClick={copyAnswer}
            aria-label="Copy answer"
          >
            {copied ? "Copied" : "Copy"}
          </PillButton>
          <PillButton
            icon={<RefreshCw size={13} />}
            onClick={() =>
              useChat.getState().research(block.query, { threadId, blockId: block.id })
            }
            aria-label="Regenerate answer"
          >
            Regenerate
          </PillButton>
          <PillButton icon={<Link2 size={13} />} onClick={shareLink} aria-label="Share link">
            Share
          </PillButton>
          <span className="mx-1 h-4 w-px bg-hair" aria-hidden />
          <PillButton
            icon={<ThumbsUp size={13} />}
            aria-label="Good answer"
            aria-pressed={block.reaction === "up"}
            onClick={() => setReaction(threadId, block.id, "up")}
            className={cn(block.reaction === "up" && "text-accent-text")}
          />
          <PillButton
            icon={<ThumbsDown size={13} />}
            aria-label="Poor answer"
            aria-pressed={block.reaction === "down"}
            onClick={() => setReaction(threadId, block.id, "down")}
            className={cn(block.reaction === "down" && "text-danger")}
          />
        </div>
      )}

      {!streaming && block.status === "stopped" && (
        <div className="mt-3 flex items-center gap-2 rounded-dialog border border-hair bg-surface-2 px-3 py-2 text-[13px] text-text-2">
          <OctagonPause size={14} className="shrink-0" />
          <span className="flex-1">Research stopped — showing what's been gathered so far.</span>
          <button
            onClick={() =>
              useChat.getState().research(block.query, { threadId, blockId: block.id })
            }
            className="shrink-0 font-medium text-accent-text hover:underline"
          >
            Continue researching
          </button>
        </div>
      )}
    </article>
  );
}

function StreamingCaret({ enabled }: { enabled: boolean }): React.JSX.Element | null {
  if (!enabled) return null;
  return (
    <span className="caret-blink ml-0.5 inline-block h-[18px] w-[2px] translate-y-[3px] rounded bg-accent" />
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): React.JSX.Element {
  return (
    <div className="rounded-dialog border border-danger/30 bg-danger-soft px-3.5 py-3" role="alert">
      <div className="flex items-start gap-2.5">
        <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text">Research could not complete</p>
          <p className="mt-0.5 text-[13px] text-text-2">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 rounded-card border border-hair-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
