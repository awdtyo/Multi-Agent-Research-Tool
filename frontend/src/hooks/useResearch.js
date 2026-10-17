import { useState, useCallback, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5173";

export function useResearch() {
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("research-history") || "[]");
    } catch (_) {
      return [];
    }
  });

  const abortControllerRef = useRef(null);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem("research-history", JSON.stringify(conversationHistory));
    } catch (_) {
      // ignore
    }
  }, [conversationHistory]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setError(null);
  }, []);

  const startStream = useCallback(async (query) => {
    // Reset state
    setAnswer("");
    setSources([]);
    setSteps([]);
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = null;

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newlines)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // keep incomplete part in buffer

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = null;
          let dataStr = null;

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (dataStr === null) continue;

          let parsed;
          try {
            parsed = JSON.parse(dataStr);
          } catch (_) {
            continue;
          }

          switch (eventType) {
            case "step":
              setSteps((prev) => [...prev, parsed]);
              break;
            case "source":
              setSources((prev) => [...prev, parsed]);
              break;
            case "token":
              if (parsed.text) {
                setAnswer((prev) => prev + parsed.text);
              }
              break;
            case "done":
              setLoading(false);
              // Add to conversation history
              setConversationHistory((prev) => [
                {
                  id: Date.now(),
                  query,
                  answer,
                  sources,
                  timestamp: new Date().toISOString(),
                },
                ...prev,
              ].slice(0, 50));
              return;
            case "error":
              setError(parsed.message || "Stream error");
              setLoading(false);
              return;
            default:
              break;
          }
        }
      }

      if (!controller.signal.aborted) {
        setLoading(false);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setLoading(false);
        return;
      }
      if (!controller.signal.aborted) {
        setError(err.message || "Research failed");
        setLoading(false);
      }
    }
  }, [API_BASE]);

  return {
    answer,
    sources,
    steps,
    loading,
    error,
    conversationHistory,
    startStream,
    stop,
  };
}