export default function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="sources-section">
      <div className="sources-header">
        <span className="sources-title">Sources</span>
        <span className="sources-count">{sources.length}</span>
      </div>
      <div className="sources-grid">
        {sources.map((src) => (
          <div
            key={src.url || src.id}
            className="source-card"
            onClick={() => {
              if (src.url) window.open(src.url, "_blank", "noopener,noreferrer");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" && src.url) {
                window.open(src.url, "_blank", "noopener,noreferrer");
              }
            }}
          >
            <div className="source-header">
              <img
                className="source-favicon"
                src={`https://www.google.com/s2/favicons?domain=${
                  src.domain || ""
                }&sz=32`}
                alt=""
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="source-title">{src.title || "Untitled"}</div>
            </div>
            <div className="source-domain">{src.domain || ""}</div>
            {src.snippet && (
              <div className="source-snippet">{src.snippet}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}