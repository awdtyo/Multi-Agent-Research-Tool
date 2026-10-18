import { useCallback, useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

export type BackendHealth = "checking" | "up" | "down";

/** Polls /api/health so the UI can warn when the backend is unreachable. */
export function useBackendHealth(): { health: BackendHealth; recheck: () => void } {
  const [health, setHealth] = useState<BackendHealth>("checking");

  const recheck = useCallback((): void => {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 4000);
    setHealth("checking");
    healthCheck(ac.signal)
      .then(() => setHealth("up"))
      .catch(() => setHealth("down"))
      .finally(() => clearTimeout(timeout));
  }, []);

  useEffect(() => {
    recheck();
    const onOnline = (): void => recheck();
    window.addEventListener("online", onOnline);
    const interval = setInterval(recheck, 20_000);
    return () => {
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
  }, [recheck]);

  return { health, recheck };
}
