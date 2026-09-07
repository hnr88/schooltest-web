import { create } from 'zustand';

import { onAuthInvalid, readClientToken, writeClientToken } from '@/lib/axios/strapi';

import type { AuthState } from '@/modules/auth/types/stores.types';

// Client state only: the JWT (persisted in localStorage via the axios helpers).
// The authenticated user itself is server state, owned by useMeQuery.
//
// GAP-6: `sessionExpired` is raised by the axios boundary's auth-invalid
// signal — a 401 the caller did not cause by signing out — and cleared by any
// explicit token write (a fresh sign-in, or a deliberate sign-out). The ops
// guard renders the design-drawn session-expired card from it instead of
// bounce-redirecting; it is in-memory only, so a fresh page load starts clean.
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,
  sessionExpired: false,
  hydrate: () => set({ token: readClientToken(), hydrated: true, sessionExpired: false }),
  setToken: (token) => {
    writeClientToken(token);
    set({ token, sessionExpired: false });
  },
  markSessionExpired: () => set({ sessionExpired: true }),
}));

// The axios layer cannot import this store (the store already imports the
// axios helpers), so the store subscribes to the boundary's auth-invalid
// channel here — module scope, exactly once.
onAuthInvalid(() => useAuthStore.getState().markSessionExpired());
