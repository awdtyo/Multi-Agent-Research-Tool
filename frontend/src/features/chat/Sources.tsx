import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Favicon } from "@/components/Favicon";
import { useSourceInteraction } from "@/features/chat/interaction";
import { cn, prettyDomain, truncate } from "@/lib/utils";
import type { Source } from "@/types/chat";

/** One compact source card; index is 1-based and matches citation chips. */
export function SourceCard({
  source,
  index,
}: {
  source: Source;
  index: number;
}): React.JSX.Element {
  const { hoveredSource, setHoveredSource } = useSourceInteraction();
  const highlighted = hoveredSource === index;

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHoveredSource(index)}
      onMouseLeave={() => setHoveredSource(null)}
      className={cn(
        "group relative flex h-[74px] w-[200px] shrink-0 flex-col gap-1 rounded-card border p-2.5 transition-colors duration-[var(--dur-fast)]",
        highlighted
          ? "border-accent bg-accent-soft"
          : "border-hair bg-surface hover:border-hair-strong hover:bg-surface-2",
      )}
      id={`source-card-${index}`}
    >
      <span className="flex items-center gap-1.5">
        <Favicon url={source.url} className="h-4 w-4" />
        <span className="min-w-0 flex-1 truncate text-[11px] text-text-3">
          {source.domain ?? prettyDomain(source.url)}
        </span>
        <span className="text-[11px] font-semibold text-text-3 group-hover:text-text-2">
          {index}
        </span>
      </span>
      <span className="line-clamp-2 text-[12.5px] leading-snug text-text">
        {source.title ?? prettyDomain(source.url)}
      </span>
    </a>
  );
}

/** Horizontal row of compact source cards; cards appear one by one. */
export function SourcesRow({
  sources,
  onOpenAll,
}: {
  sources: Source[];
  onOpenAll: () => void;
}): React.JSX.Element {
  return (
    <section aria-label="Sources" className="mb-5">
      <div className="flex items-center gap-2">
        <div className="scroll-fade-right flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {sources.map((source, i) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: Math.min(i, 6) * 0.06, ease: "easeOut" }}
              className="shrink-0"
            >
              <SourceCard source={source} index={i + 1} />
            </motion.div>
          ))}
        </div>
        {sources.length > 3 && (
          <button
            onClick={onOpenAll}
            className="shrink-0 rounded-card border border-hair bg-surface px-3 py-2 text-xs font-medium text-text-2 transition-colors hover:border-hair-strong hover:text-text"
          >
            Show all ({sources.length})
          </button>
        )}
      </div>
    </section>
  );
}

export function SourceListForPanel({ sources }: { sources: Source[] }): React.JSX.Element {
  return (
    <ul className="flex flex-col divide-y divide-hair">
      {sources.map((source, i) => (
        <li key={source.id}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-hair text-[11px] font-semibold text-text-2 group-hover:border-accent/40 group-hover:text-accent-text">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 flex items-center gap-1.5">
                <Favicon url={source.url} className="h-4 w-4" />
                <span className="text-[11px] text-text-3">
                  {source.domain ?? prettyDomain(source.url)}
                </span>
              </span>
              <span className="block text-sm font-medium leading-snug text-text">
                {source.title ?? prettyDomain(source.url)}
              </span>
              {source.snippet && (
                <span className="mt-1 block text-xs leading-relaxed text-text-2">
                  {truncate(source.snippet, 180)}
                </span>
              )}
            </span>
            <ExternalLink
              size={13}
              className="shrink-0 text-text-3 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
