import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { X } from "lucide-react";
import { useState } from "react";
import { useSourceInteraction } from "@/features/chat/interaction";
import { SourceListForPanel } from "@/features/chat/Sources";

/** Side panel listing every source for the block in order. */
export function SourcesPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const { sources } = useSourceInteraction();
  const [copied, setCopied] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px]" />
        <Dialog.Content className="panel-slide-in fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-hair bg-surface shadow-2 outline-none">
          <div className="flex items-center justify-between border-b border-hair px-4 py-3">
            <div>
              <Dialog.Title className="text-sm font-semibold text-text">Sources</Dialog.Title>
              <Dialog.Description className="text-xs text-text-2">
                {sources.length} page{sources.length === 1 ? "" : "s"} found by the search agent
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  void navigator.clipboard
                    .writeText(
                      sources
                        .map((s, i) => `[${i + 1}] ${s.title ?? s.url}\n${s.url}`)
                        .join("\n\n"),
                    )
                    .then(() => setCopied(true))
                    .finally(() => setTimeout(() => setCopied(false), 1500));
                }}
                className="rounded-full p-2 text-text-2 transition-colors hover:bg-surface-3 hover:text-text"
                aria-label="Copy source list"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
              <button
                onClick={() => {
                  const first = sources[0];
                  if (first) {
                    window.open(first.url, "_blank", "noopener,noreferrer");
                  }
                }}
                className="rounded-full p-2 text-text-2 transition-colors hover:bg-surface-3 hover:text-text"
                aria-label="Open first source"
              >
                <ExternalLink size={15} />
              </button>
              <Dialog.Close
                className="rounded-full p-2 text-text-2 transition-colors hover:bg-surface-3 hover:text-text"
                aria-label="Close sources"
              >
                <X size={16} />
              </Dialog.Close>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sources.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-2">
                No sources in this answer.
              </p>
            ) : (
              <SourceListForPanel sources={sources} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
