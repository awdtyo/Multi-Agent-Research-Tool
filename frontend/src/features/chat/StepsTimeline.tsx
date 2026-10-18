import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepDisplay } from "@/types/chat";

interface StepsTimelineProps {
  steps: StepDisplay[];
  /** during streaming, the active step pulses; when done, the rail collapses */
  running: boolean;
}

const itemAnim = {
  hidden: { opacity: 0, y: 6 },
  shown: { opacity: 1, y: 0 },
};

export function StepsTimeline({ steps, running }: StepsTimelineProps): React.JSX.Element | null {
  const [showFull, setShowFull] = useState(false);

  if (steps.length === 0) return null;

  const collapsed = !running && steps.length > 1 && !showFull;

  return (
    <section aria-label="Research steps" className="mb-5">
      <div
        className={cn(
          "overflow-hidden rounded-dialog transition-colors duration-[var(--dur)]",
          running ? "bg-surface" : "bg-surface-2",
        )}
      >
        {collapsed ? (
          <button
            onClick={() => setShowFull(true)}
            className="group flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-text-2 transition-colors hover:text-text"
            aria-expanded={false}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 text-text-2">
              <Check size={11} strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1 truncate">{summaryLine(steps, running)}</span>
            <ChevronDown size={14} className="shrink-0 text-text-3 group-hover:text-text-2" />
          </button>
        ) : (
          <>
            {!running && (
              <button
                onClick={() => setShowFull(false)}
                className="group flex w-full items-center gap-2 px-3 pb-2 pt-2.5 text-left text-[13px] text-text-2 transition-colors hover:text-text"
                aria-expanded={true}
              >
                <span className="flex-1 truncate">{summaryLine(steps, running)}</span>
                <ChevronDown
                  size={14}
                  className="shrink-0 transition-transform duration-[var(--dur)]"
                  style={{ transform: "rotate(180deg)" }}
                />
              </button>
            )}
            <Timeline steps={steps} />
          </>
        )}
      </div>
    </section>
  );
}

function summaryLine(steps: StepDisplay[], running: boolean): string {
  if (running) return steps[steps.length - 1]?.label ?? "Working";
  const readCount = steps.filter((s) => s.label.startsWith("Reading")).length;
  const parts = ["Searched the web"];
  if (readCount > 0) parts.push(`Read ${readCount} page${readCount === 1 ? "" : "s"}`);
  parts.push(`${steps.length} step${steps.length === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function Timeline({ steps }: { steps: StepDisplay[] }): React.JSX.Element {
  return (
    <ol className="flex flex-col px-3 py-2.5">
      <AnimatePresence initial={false}>
        {steps.map((step, i) => (
          <motion.li
            key={step.id}
            variants={itemAnim}
            initial="hidden"
            animate="shown"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative flex min-h-8 items-start gap-3 py-0.5 text-[13px]"
          >
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[10px] top-[22px] h-[calc(100%-14px)] w-px bg-hair"
              />
            )}
            <StepIcon state={step.state} />
            <div className="min-w-0 flex-1 leading-6">
              <span className={cn(step.state === "active" ? "text-text" : "text-text-2")}>
                {step.label}
              </span>
              {step.detail && (
                <span className="block truncate text-xs text-text-3">{step.detail}</span>
              )}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

function StepIcon({ state }: { state: StepDisplay["state"] }): React.JSX.Element {
  if (state === "done") {
    return (
      <span className="z-10 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-hair bg-bg text-text-2">
        <Check size={11} strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "stopped") {
    return (
      <span className="z-10 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-hair bg-bg text-text-3">
        <Minus size={11} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="relative z-10 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-accent/40 bg-bg">
      <span className="motion-safe-pulse h-[8px] w-[8px] rounded-full bg-accent" />
    </span>
  );
}
