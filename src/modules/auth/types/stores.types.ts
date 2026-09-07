export interface AuthState {
  token: string | null;
  hydrated: boolean;
  /** GAP-6: a 401 the user did not cause by signing out — the expired signal. */
  sessionExpired: boolean;
  hydrate: () => void;
  setToken: (token: string | null) => void;
  markSessionExpired: () => void;
}
