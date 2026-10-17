import { Search, Clock, Trash2 } from "lucide-react";

export default function ConversationSidebar({
  history,
  onSelect,
  onRemove,
  onClear,
  onNewSearch,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Search size={20} strokeWidth={2} style={{ marginRight: "0.5rem" }} />
          Research
        </div>
        <button
          className="theme-toggle"
          onClick={onNewSearch}
          title="New search"
        >
          <Search size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="sidebar-list">
        {history.length === 0 ? (
          <div style={{
            padding: "0.625rem 0.875rem",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
          }}>
            No recent searches
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="sidebar-item"
              onClick={() => onSelect(item)}
            >
              <div>
                <div className="sidebar-item-title">{item.query}</div>
                <div className="sidebar-item-meta">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                title="Remove"
                style={{
                  opacity: 0,
                  marginLeft: "auto",
                }}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>

      {history.length > 0 && (
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={onClear}
            className="copy-button"
            style={{
              width: "100%",
              textAlign: "left",
              background: "transparent",
              color: "var(--danger)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <Trash2 size={16} strokeWidth={2} style={{ marginRight: "0.5rem" }} />
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}