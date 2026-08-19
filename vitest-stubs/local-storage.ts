/**
 * Restore `localStorage` under vitest on Node >= 26.
 *
 * Node 26 ships its own experimental `localStorage` global. It is installed as a
 * getter on `globalThis` that returns `undefined` unless the process was started
 * with `--localstorage-file`, and because vitest's jsdom environment uses
 * `window === globalThis`, that getter SHADOWS jsdom's real implementation —
 * `window.localStorage` reads as `undefined` while `sessionStorage` keeps
 * working. Every zustand `persist` store and every test that touches
 * `localStorage` then dies on "Cannot read properties of undefined".
 *
 * The Node getter is `configurable`, so we replace it with an in-memory Storage.
 * Registered via `setupFiles`, so each test file gets a fresh, isolated store.
 * Drop this stub once the toolchain no longer runs on a Node that does this.
 * Mirrors schooltest-app/vitest-stubs/local-storage.ts.
 */
function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();

  return {
    get length(): number {
      return entries.size;
    },
    key(index: number): string | null {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key: string): string | null {
      return entries.get(String(key)) ?? null;
    },
    setItem(key: string, value: string): void {
      entries.set(String(key), String(value));
    },
    removeItem(key: string): void {
      entries.delete(String(key));
    },
    clear(): void {
      entries.clear();
    },
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}