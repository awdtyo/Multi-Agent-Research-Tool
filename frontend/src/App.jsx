import { useState, useCallback } from "react";
import { Plus, ArrowLeft, Copy, StopCircle as StopCircleIcon } from "lucide-react";
import { useTheme } from "./hooks/useTheme";
import { useResearch } from "./hooks/useResearch";
import SearchBox from "./components/SearchBox";
import StepsTimeline from "./components/StepsTimeline";
import Answer from "./components/Answer";
import Sources from "./components/Sources";
import FollowUp from "./components/FollowUp";
import ConversationSidebar from "./components/ConversationSidebar";
import ThemeToggle from "./components/ThemeToggle";

const FOLLOW_UP_PROMPTS = [
  "Can you go deeper on this?",
  "What are the key risks?",
  "Summarize in bullet points",
  "What are the sources?",
];

export default function App() {
  const { theme, toggle, mounted } = useTheme();
  const {
    answer,
    sources,
    steps,
    loading,
    error,
    conversationHistory,
    startStream,
    stop,
  } = useResearch();

  const [query, setQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  const handleNewSearch = useCallback(() => {
    setQuery("");
    setHasSearched(false);
    setHistoryItem(null);
    setShowSidebar(false);
    stop();
  }, [stop]);

  const handleSelectHistory = useCallback((item) => {
    setQuery(item.query);
    setAnswer(item.answer);
    setSources(item.sources);
    setSteps([]);
    setHasSearched(true);
    setHistoryItem(item);
    setShowSidebar(false);
  }, []);

  const handleRemoveHistory = useCallback((id) => {
    setConversationHistory((prev) => prev.filter((h) => h.id !== id));
  }, [setConversationHistory]);

  const handleClearHistory = useCallback(() => {
    setConversationHistory([]);
    setHistoryItem(null);
  }, [setConversationHistory]);

  const handleSubmit = useCallback((q) => {
    setQuery(q);
    setHasSearched(true);
    setHistoryItem(null);
    startStream(q);
  }, [startStream]);

  const handleFollowUp = useCallback((q) => {
    setQuery(q);
    setHasSearched(true);
    startStream(q);
  }, [startStream]);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
  };

  if (!mounted) return null;

  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      {hasSearched && (
        <header className="header">
          <div className="header-content">
            <div className="header-flex">
              <button
                className="back-button"
                onClick={() => {
                  setHasSearched(false);
                  setHistoryItem(null);
                }}
              >
                <ArrowLeft size={18} strokeWidth={2} />
                Back
              </button>
              <ThemeToggle theme={theme} toggle={toggle} />
              <button
                className="mobile-menu-button"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="main">
        {!hasSearched ? (
          <div className="landing">
            <div className="landing-brand">Research.</div>
            <div className="landing-subtitle">
              Multi-agent research powered by LangGraph, Groq & Tavily
            </div>
            <SearchBox
              query={query}
              setQuery={setQuery}
              onSubmit={handleSubmit}
              loading={loading}
              onStop={stop}
            />
          </div>
        ) : (
          <div>
            <SearchBox
              query={query}
              setQuery={setQuery}
              onSubmit={handleSubmit}
              loading={loading}
              onStop={stop}
            />

            {error && (
              <div
                style={{
                  padding: "1rem",
                  background: "var(--danger-soft)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--danger)",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            <StepsTimeline steps={steps} />

            <Answer answer={answer} sources={sources} onCopy={handleCopy} />

            <div className="controls-row">
              {loading && (
                <button
                  className="stop-button"
                  onClick={stop}
                  aria-label="Stop research"
                >
                  <StopCircleIcon /> Stop
                </button>
              )}
              {!loading && answer && (
                <button
                  className="copy-button"
                  onClick={handleCopy}
                  aria-label="Copy answer"
                >
                  <Copy size={18} strokeWidth={2} /> Copy answer
                </button>
              )}
            </div>

            <Sources sources={sources} />

            <FollowUp
              questions={answer ? FOLLOW_UP_PROMPTS : []}
              onSelect={handleFollowUp}
            />
          </div>
        )}
      </main>

      <ConversationSidebar
        history={conversationHistory}
        onSelect={handleSelectHistory}
        onRemove={handleRemoveHistory}
        onClear={handleClearHistory}
        onNewSearch={handleNewSearch}
      />
    </div>
  );
}