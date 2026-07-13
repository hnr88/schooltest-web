import { create } from 'zustand';

import { readClientToken, writeClientToken } from '@/lib/axios/strapi';

interface AuthState {
  token: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setToken: (token: string | null) => void;
}

// Client state only: the JWT (persisted in localStorage via the axios helpers).
// The authenticated user itself is server state, owned by useMeQuery.
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,
  hydrate: () => set({ token: readClientToken(), hydrated: true }),
  setToken: (token) => {
    writeClientToken(token);
    set({ token });
  },
}));
