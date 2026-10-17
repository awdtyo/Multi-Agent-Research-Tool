export default function FollowUp({ questions, onSelect }) {
  if (!questions || questions.length === 0) return null;

  return (
    <section className="followup-section">
      <div className="followup-title">Follow-up questions</div>
      <div className="followup-grid">
        {questions.map((q, idx) => (
          <button
            key={idx}
            className="followup-chip"
            onClick={() => onSelect(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}