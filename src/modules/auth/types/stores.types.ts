export interface AuthState {
  token: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setToken: (token: string | null) => void;
}
