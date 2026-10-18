export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function domainOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function prettyDomain(url: string): string {
  const domain = domainOf(url);
  if (!domain) return url.length > 32 ? `${url.slice(0, 32)}…` : url;
  // drop a short path tail when it adds real detail
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    if (path && path !== "/" && path.length <= 28) {
      return `${domain}${path}`;
    }
    return domain;
  } catch {
    return domain;
  }
}

export function titleFromUrl(url: string): string {
  const domain = domainOf(url);
  if (!domain) return "Source";
  const path = domain.split(".");
  path.pop();
  const stem = path[path.length - 1] ?? domain;
  return stem.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Fallback chain: DuckDuckGo, then Google, then the app's own placeholder. */
export function faviconCandidates(domain: string): string[] {
  return [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ];
}

import type { Thread } from "@/types/chat";

export type HistoryGroup = "Today" | "Yesterday" | "Earlier";

function groupKey(updatedAt: number): HistoryGroup {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  if (updatedAt >= today) return "Today";
  if (updatedAt >= yesterday) return "Yesterday";
  return "Earlier";
}

export function groupThreads(threads: Thread[]): {
  group: HistoryGroup;
  threads: Thread[];
}[] {
  const order: HistoryGroup[] = [];
  const buckets = new Map<HistoryGroup, Thread[]>();
  for (const thread of threads) {
    const group = groupKey(thread.updatedAt);
    let list = buckets.get(group);
    if (!list) {
      list = [];
      buckets.set(group, list);
      order.push(group);
    }
    list.push(thread);
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return order.map((group) => {
    const list = buckets.get(group) ?? [];
    return { group, threads: list };
  });
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
