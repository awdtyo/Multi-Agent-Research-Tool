import { Fragment, type ReactNode } from "react";
import { useSourceInteraction } from "@/features/chat/interaction";
import { cn } from "@/lib/utils";

const CITATION_RE = /\[(\d{1,2})\]/g;

/**
 * Renders raw text strings from markdown children, turning [n] references
 * into citation chips linked to source n. Hovering a chip highlights the
 * matching source card; clicking opens the source.
 */
export function Citations({ children }: { children: ReactNode }): React.JSX.Element {
  const { sources, hoveredSource, setHoveredSource } = useSourceInteraction();

  const parts: ReactNode[] = [];
  let idx = 0;
  const array: ReactNode[] = Array.isArray(children) ? (children as ReactNode[]) : [children];

  for (const child of array) {
    if (typeof child !== "string") {
      parts.push(child);
      continue;
    }
    let cursor = 0;
    let match: RegExpExecArray | null;
    CITATION_RE.lastIndex = 0;
    while ((match = CITATION_RE.exec(child)) !== null) {
      if (match.index > cursor) {
        parts.push(child.slice(cursor, match.index));
      }
      const n = Number(match[1]);
      const source = sources[n - 1];
      parts.push(
        <button
          key={`cite-${idx++}`}
          type="button"
          disabled={!source}
          title={source ? (source.title ?? prettyDomainOf(source.url)) : undefined}
          onClick={() => {
            if (source) window.open(source.url, "_blank", "noopener,noreferrer");
          }}
          onMouseEnter={() => setHoveredSource(n)}
          onMouseLeave={() => setHoveredSource(null)}
          className={cn(
            "mx-0.5 inline-flex h-[18px] min-w-[18px] translate-y-[-2px] items-center justify-center rounded-full",
            "px-1 align-middle text-[11px] font-semibold leading-none transition-colors duration-[var(--dur-fast)]",
            "border",
            source === undefined && "border-hair text-text-3 opacity-60", // referring to a source we don't have
            source !== undefined &&
              "border-accent/35 bg-accent-soft text-accent-text hover:border-accent hover:bg-accent hover:text-on-accent",
            source !== undefined && hoveredSource === n && "border-accent bg-accent text-on-accent",
          )}
        >
          {match[1]}
        </button>,
      );
      cursor = match.index + match[0].length;
    }
    if (cursor < child.length) {
      parts.push(child.slice(cursor));
    }
  }

  return <Fragment>{parts}</Fragment>;
}

function prettyDomainOf(url: string): string {
  const domain = url.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  return domain.replace(/^www\./, "");
}
