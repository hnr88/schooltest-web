export interface AuthState {
  token: string | null;
  hydrated: boolean;
  /** GAP-6: a 401 the user did not cause by signing out — the expired signal. */
  sessionExpired: boolean;
  /**
   * W3-20: the API's MFA gate asked this session for a second factor
   * (403 MFA_REQUIRED). In memory only; cleared by any explicit token write.
   */
  mfaRequired: boolean;
  hydrate: () => void;
  setToken: (token: string | null) => void;
  markSessionExpired: () => void;
  markMfaRequired: () => void;
}
