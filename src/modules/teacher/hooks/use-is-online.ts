'use client';

/**
 * teacher/09 — the live roll-up's offline signal. TanStack PAUSES when the
 * browser is offline: `isPending` stays true and `isError` stays false, so a
 * paused read is indistinguishable from a slow one — and an unguarded empty
 * state would tell a disconnected teacher "Nothing is running right now",
 * which is a false statement about their classroom. The components check this
 * before any empty branch.
 */
import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

const getSnapshot = () => navigator.onLine;

function getServerSnapshot(): boolean {
  return true;
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
