/**
 * Collapsible "agent review" card: the critic agent's verdict on the report,
 * rendered as a compact module under the answer.
 */
import { useState } from "react";
import { ChevronDown, ScanSearch } from "lucide-react";
import { Markdown, Prose } from "@/components/Markdown";
import { cn } from "@/lib/utils";

const SCORE_RE = /score:\s*(\d{1,2}(?:\.\d+)?)\s*\/\s*10/i;

/** Feedback text arrives as partially-bulleted markdown; normalize dashes. */
function plainish(review: string): string {
  return review
    .replace(/\n\n+/g, "\n\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^[-•*]\s+/.test(trimmed)) return `- ${trimmed.replace(/^[-•*]\s+/, "")}`;
      return line;
    })
    .join("\n");
}

export function ReviewBlock({
  review,
  visible,
}: {
  review?: string;
  visible: boolean;
}): React.JSX.Element | null {
  const [open, setOpen] = useState(false);

  if (!visible || !review?.trim()) return null;

  const score = SCORE_RE.exec(review)?.[1];
  const verdictLine = review
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !/^score:/i.test(line) &&
        !/^(strengths|areas to improve|one line verdict):?$/i.test(line),
    )
    .pop();

  return (
    <section
      aria-label="Agent review"
      className="mt-4 overflow-hidden rounded-dialog border border-hair bg-surface-2"
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-text-2 transition-colors hover:text-text"
      >
        <ScanSearch size={14} className="shrink-0 text-accent-text" />
        <span className="font-medium">Review</span>
        {score && (
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-text-2">
            {parseInt(score, 10)}/10
          </span>
        )}
        {!open && verdictLine && (
          <span className="line-clamp-1 min-w-0 flex-1 truncate pl-1 text-xs text-text-3">
            {verdictLine}
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-text-3 transition-transform duration-[var(--dur)]",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-hair px-4 py-3 text-[14px] leading-relaxed text-text-2">
          <Prose className="font-ui text-[13.5px] leading-relaxed">
            <Markdown text={plainish(review)} />
          </Prose>
        </div>
      )}
    </section>
  );
}
