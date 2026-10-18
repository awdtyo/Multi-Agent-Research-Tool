/**
 * Tiny history-API router: "/" for landing, "/t/:threadId" for a thread,
 * anything else is a 404. Includes `navigate` and a `back` helper.
 */

import { useEffect, useState } from "react";

export interface Route {
  name: "landing" | "thread" | "not-found";
  threadId?: string;
}

function parse(path: string): Route {
  if (path === "/" || path === "") return { name: "landing" };
  const match = /^\/t\/([A-Za-z0-9-]+)\/?$/.exec(path);
  if (match) return { name: "thread", threadId: match[1] };
  return { name: "not-found" };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));

  useEffect(() => {
    const onPop = (): void => {
      setRoute(parse(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return route;
}

export function navigate(path: string, replace = false): void {
  if (replace) {
    window.history.replaceState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } else {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
