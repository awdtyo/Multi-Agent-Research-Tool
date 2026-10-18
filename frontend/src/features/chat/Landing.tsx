import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { PromptInput } from "@/features/chat/PromptInput";
import { LogoMark } from "@/features/chat/Sidebar";

const EXAMPLES = [
  "LFP vs NMC batteries: cost, density, lifespan",
  "How attention works in transformers, plainly",
  "mRNA platforms beyond COVID vaccines",
  "Memory consolidation during sleep — recent findings",
];

interface LandingProps {
  onSubmit: (query: string) => void;
  streaming: boolean;
  onStop: () => void;
}

const ease = [0.3, 0.7, 0.3, 1] as const;

export function Landing({ onSubmit, streaming, onStop }: LandingProps): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 pb-[8vh]">
      <motion.div
        layoutId="ask-shell"
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="flex w-full max-w-[640px] flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8 flex flex-col items-center"
        >
          <LogoMark className="mb-4 h-12 w-12 text-[22px]" />
          <h1 className="text-4xl font-semibold tracking-tight text-text">Delve</h1>
          <p className="mt-2 text-[15px] text-text-2">
            Research that reads its sources — and shows them.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="w-full"
        >
          <PromptInput
            onSubmit={onSubmit}
            streaming={streaming}
            onStop={onStop}
            autoFocus
            className="w-full text-base"
          />
          <p className="mt-2 text-center text-xs text-text-3">
            First it searches, then reads, then writes — with inline citations.
          </p>
        </motion.div>

        <motion.ul
          initial="hidden"
          animate="shown"
          variants={{
            hidden: {},
            shown: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
          }}
          className="mt-6 flex flex-wrap items-start justify-center gap-2"
        >
          {EXAMPLES.map((example) => (
            <motion.li
              key={example}
              variants={{
                hidden: { opacity: 0, y: 8 },
                shown: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35, ease }}
            >
              <button
                onClick={() => onSubmit(example)}
                className="group flex items-center gap-1.5 rounded-pill border border-hair bg-surface px-3.5 py-2 text-[13px] text-text-2 transition-colors duration-[var(--dur-fast)] hover:border-accent/40 hover:bg-surface-2 hover:text-text"
              >
                <span className="line-clamp-1 max-w-[300px]">{example}</span>
                <ArrowUpRight
                  size={13}
                  className="shrink-0 text-text-3 transition-colors group-hover:text-accent"
                />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
}
