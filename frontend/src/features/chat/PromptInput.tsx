import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tip } from "@/components/Tooltip";

interface PromptInputProps {
  onSubmit: (query: string) => void;
  /** Shown while a stream is running: the input becomes the stop control. */
  onStop?: () => void;
  streaming?: boolean;
  /** Compacting: smaller paddings for the sticky follow-up input. */
  compact?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

const MAX_HEIGHT = 200;

export function PromptInput({
  onSubmit,
  onStop,
  streaming = false,
  compact = false,
  autoFocus = false,
  placeholder = "Ask anything — we'll search, read and cite sources.",
  className,
}: PromptInputProps): React.JSX.Element {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const submit = (): void => {
    const text = value.trim();
    if (!text || streaming) return;
    onSubmit(text);
    setValue("");
  };

  return (
    <div
      className={cn(
        "relative flex max-h-[260px] items-end gap-2 rounded-input border shadow-1",
        "border-hair bg-surface focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25",
        compact ? "px-3 py-2" : "px-4 py-3",
        "transition-[border-color,box-shadow] duration-[var(--dur)]",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape" && streaming && onStop) {
            e.stopPropagation();
            onStop();
          }
        }}
        rows={1}
        aria-label="Research prompt"
        spellCheck={false}
        placeholder={placeholder}
        className="max-h-[200px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-text outline-none placeholder:text-text-3"
      />
      <div className={cn("flex items-center gap-1", compact && "pb-0.5")}>
        {streaming && onStop ? (
          <Tip label="Stop (Esc)">
            <button
              type="button"
              aria-label="Stop generating"
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-text-2 transition-colors duration-[var(--dur-fast)] hover:text-danger"
            >
              <Square size={13} fill="currentColor" strokeWidth={2} />
            </button>
          </Tip>
        ) : (
          <Tip label="Submit (Enter)">
            <button
              type="button"
              aria-label="Submit research query"
              disabled={!value.trim() || streaming}
              onClick={submit}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-[var(--dur-fast)]",
                value.trim() && !streaming
                  ? "bg-accent text-on-accent hover:bg-accent-hover"
                  : "bg-surface-3 text-text-3",
              )}
            >
              <ArrowUp size={16} strokeWidth={2.4} />
            </button>
          </Tip>
        )}
      </div>
    </div>
  );
}
