export type VisibilityKey = 'current' | 'next' | 'confirm';

export type ParentViewsGate = 'loading' | 'pass' | 'unavailable' | 'redirect';

export interface UseResetPasswordFormOptions {
  code: string;
  onExpiredCode: () => void;
  onInvalidCode: () => void;
  onSuccess: () => void;
}
