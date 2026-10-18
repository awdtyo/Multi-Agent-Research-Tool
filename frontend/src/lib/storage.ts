/**
 * Storage interface so in-memory/localStorage persistence can later be
 * replaced by a backend-backed store without touching call sites.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters --
   T appears once per signature by design: the caller chooses how to decode
   stored JSON. */
export interface Storage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class LocalStorageStore implements Storage {
  private prefix: string;

  constructor(prefix = "delve") {
    this.prefix = prefix;
  }

  private full(key: string): string {
    return `${this.prefix}.${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(this.full(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(this.full(key), JSON.stringify(value));
    } catch {
      // quota exceeded or storage disabled: persistence fails silently,
      // the app keeps working in memory
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(this.full(key));
    } catch {
      // ignore
    }
  }
}
