'use client';

import { useSyncExternalStore } from 'react';

/**
 * The portal's ONE online/offline listener (Ops Portal.dc.html:51-58).
 *
 * The offline strip in `OpsPortalCapabilities` and the action kit's offline
 * write gate (task 03) both consume this hook, so the banner a session sees
 * and the refusal a write gets can never disagree about whether the network
 * is there. `useSyncExternalStore` subscribes to the browser's
 * `online`/`offline` events without an effect body or a state mirror, and the
 * server snapshot reads `true` so SSR and hydration agree there is no strip
 * to show until the browser itself reports otherwise.
 */
function subscribe(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
