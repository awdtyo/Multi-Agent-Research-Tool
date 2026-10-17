export default function Answer({ answer, sources, onCopy }) {
  // Replace [1], [2] etc with citation links
  const renderCitations = (text) => {
    return text.replace(/\[(\d+)\]/g, (match, num) => {
      const source = sources.find((s) => s.id === parseInt(num, 10));
      if (source) {
        return (
          <a
            key={num}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="citation"
          >
            [{num}]
          </a>
        );
      }
      return match;
    });
  };

  // Split into paragraphs for rendering
  const paragraphs = answer
    ? answer.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <div className="answer-container">
      <div className="answer-card">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, idx) => (
            <p key={idx} className="answer-text">
              {renderCitations(p.trim())}
            </p>
          ))
        ) : (
          <p className="answer-text" style={{ color: "var(--text-muted)" }}>
            No answer yet.
          </p>
        )}
        {onCopy && (
          <button
            className="copy-button"
            onClick={onCopy}
            aria-label="Copy answer"
            style={{ marginTop: "1rem", float: "right" }}
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}