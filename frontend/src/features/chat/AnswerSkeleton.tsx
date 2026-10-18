import { motion } from "framer-motion";

/** Whispered "writing the report..." state before the first tokens land. */
export function AnswerSkeleton(): React.JSX.Element {
  const widths = ["92%", "100%", "78%", "96%", "64%"];
  return (
    <div className="py-1" aria-busy="true" aria-label="Drafting report">
      <div className="mb-3 flex items-center gap-2 text-[13px] text-text-2">
        <span className="motion-safe-pulse h-2 w-2 rounded-full bg-accent" />
        Drafting the report from the sources…
      </div>
      <div className="flex flex-col gap-3">
        {widths.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3, scaleY: 1 }}
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            style={{ width: w, transformOrigin: "left" }}
            className="h-3.5 rounded-pill bg-surface-3"
          />
        ))}
      </div>
    </div>
  );
}
