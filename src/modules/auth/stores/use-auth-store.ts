import { create } from 'zustand';

import { onAuthInvalid, onMfaRequired, readClientToken, writeClientToken } from '@/lib/axios/strapi';

import type { AuthState } from '@/modules/auth/types/stores.types';

// Client state only: the JWT (persisted in localStorage via the axios helpers).
// The authenticated user itself is server state, owned by useMeQuery.
//
// GAP-6: `sessionExpired` is raised by the axios boundary's auth-invalid
// signal — a 401 the caller did not cause by signing out — and cleared by any
// explicit token write (a fresh sign-in, or a deliberate sign-out). The ops
// guard renders the design-drawn session-expired card from it instead of
// bounce-redirecting; it is in-memory only, so a fresh page load starts clean.
//
// W3-20: `mfaRequired` is raised by the axios boundary's MFA_REQUIRED signal (a
// 403 from the API's MFA gate) and cleared the same way — any explicit token
// write. A successful step-up verify writes the new token, so the host's
// dialog closes; the 403 itself never touches the stored token.
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,
  sessionExpired: false,
  mfaRequired: false,
  hydrate: () =>
    set({ token: readClientToken(), hydrated: true, sessionExpired: false, mfaRequired: false }),
  setToken: (token) => {
    writeClientToken(token);
    set({ token, sessionExpired: false, mfaRequired: false });
  },
  markSessionExpired: () => set({ sessionExpired: true }),
  markMfaRequired: () => set({ mfaRequired: true }),
}));

// The axios layer cannot import this store (the store already imports the
// axios helpers), so the store subscribes to the boundary's auth-invalid
// channel here — module scope, exactly once.
onAuthInvalid(() => useAuthStore.getState().markSessionExpired());
onMfaRequired(() => useAuthStore.getState().markMfaRequired());
