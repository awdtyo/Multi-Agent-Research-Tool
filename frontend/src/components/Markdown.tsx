import { memo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { Citations } from "@/features/chat/Citations";
import { cn } from "@/lib/utils";

/** Collect the plain text of a hast node (used for code-copy). */
function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const stripped = node as { type?: string; value?: unknown; children?: unknown[] };
  if (typeof stripped.value === "string") return stripped.value;
  if (Array.isArray(stripped.children)) {
    return stripped.children.map((child) => nodeText(child)).join("");
  }
  return "";
}

function CopyCodeButton({ getCode }: { getCode: () => string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy code"
      className={cn(
        "absolute right-2 top-2 z-10 flex h-7 items-center gap-1 rounded-md border border-hair",
        "bg-surface-2/90 px-2 text-[11px] font-medium text-text-2 backdrop-blur-sm",
        "opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 focus-visible:opacity-100",
        "hover:border-hair-strong hover:text-text",
      )}
      onClick={() => {
        try {
          void navigator.clipboard.writeText(getCode());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable (e.g. http): no-op rather than crash
        }
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const components: Components = {
  p: ({ children, ...rest }) => (
    <p {...rest}>
      <Citations>{children}</Citations>
    </p>
  ),
  li: ({ children, ...rest }) => (
    <li {...rest}>
      <Citations>{children}</Citations>
    </li>
  ),
  td: ({ children, ...rest }) => (
    <td {...rest}>
      <Citations>{children}</Citations>
    </td>
  ),
  a: ({ children, ...rest }) => {
    const href = rest.href ?? "";
    const external = /^https?:\/\//i.test(href);
    return (
      <a
        {...rest}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  pre: ({ children, node }) => {
    const code = (): string => nodeText(node).replace(/\n$/, "");
    return (
      <div className="group relative">
        <CopyCodeButton getCode={code} />
        <pre>{children}</pre>
      </div>
    );
  },
  div: ({ children, ...rest }) => <div {...rest}>{children}</div>,
};

/**
 * Answer markdown: serif body, inline citations, GFM tables that scroll,
 * highlighted code blocks with a copy button.
 */
export const Markdown = memo(function Markdown({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="answer-prose font-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});

export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={cn("answer-prose font-answer", className)}>{children}</div>;
}
