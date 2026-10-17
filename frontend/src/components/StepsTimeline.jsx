export default function StepsTimeline({ steps }) {
  if (!steps || steps.length === 0) return null;

  // Only show steps that are meaningful
  const visibleSteps = steps.filter(
    (s) =>
      s.status === "running" ||
      s.status === "calling" ||
      s.status === "tool_done" ||
      s.status === "completed"
  );

  if (visibleSteps.length === 0) return null;

  const lastStep = visibleSteps[visibleSteps.length - 1];
  const isActive = lastStep.status !== "completed";

  return (
    <div className="steps-container">
      <div className="steps-timeline">
        {visibleSteps.map((step, idx) => {
          const isLast = idx === visibleSteps.length - 1;
          const active = isLast && isActive;
          return (
            <div
              key={idx}
              className={`step-item ${active ? "active" : ""} ${
                !active && isLast ? "collapsed" : ""
              }`}
            >
              <div className="step-number">{step.step ?? idx + 1}</div>
              <div className="step-dot" />
              <div className="step-content">
                <div className="step-agent">
                  {step.agent
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                  {step.tool ? ` · ${step.tool}` : ""}
                </div>
                <div className="step-message">{step.message || step.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}