import { useState } from "react";
import { Search, StopCircle } from "lucide-react";

export default function SearchBox({
  query,
  setQuery,
  onSubmit,
  loading,
  onStop,
  placeholder = "What would you like to research?",
}) {
  const [localQuery, setLocalQuery] = useState(query || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localQuery.trim() || loading) return;
    onSubmit(localQuery.trim());
  };

  const handleStop = () => {
    if (onStop) onStop();
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-box">
        <div className="search-input-wrapper">
          <span className="search-icon">
            <Search size={18} strokeWidth={2} />
          </span>
          <input
            className="search-input"
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(e);
            }}
          />
          {loading ? (
            <button
              type="button"
              className="stop-button"
              onClick={handleStop}
              aria-label="Stop research"
            >
              <StopCircle size={18} strokeWidth={2} />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="search-button"
              disabled={!localQuery.trim()}
              aria-label="Start research"
            >
              Search
            </button>
          )}
        </div>
      </form>
    </div>
  );
}