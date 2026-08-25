// Per-viewer UI preferences only (view mode, collapsed sections) — never
// board data. Wrapped in try/catch since localStorage can throw (private
// browsing, blocked storage) and should degrade to the given fallback.
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — nothing meaningful to recover from a blocked/full store
  }
}
