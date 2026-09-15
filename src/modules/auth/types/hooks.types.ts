export type VisibilityKey = 'current' | 'next' | 'confirm';

export type ParentViewsGate = 'loading' | 'pass' | 'unavailable' | 'redirect';

export interface UseResetPasswordFormOptions {
  code: string;
  onExpiredCode: () => void;
  onInvalidCode: () => void;
  onSuccess: () => void;
}

// NIGHT-2 (W-R4, TEA-063): options of the useRequire* role-guard hooks.
// `bounce: false` silences the wrong-role redirect for callers that resolve the
// audience across several roles — ReportAudienceGate mounts all three role
// hooks at once, and every non-matching hook's bounce would fight the gate's
// own arm selection by yanking the caller off the page. Guards that own a
// route outright keep the default (`bounce: true`).
export interface RequireRoleOptions {
  bounce?: boolean;
}

