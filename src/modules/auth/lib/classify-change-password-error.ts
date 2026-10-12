import { isAxiosError } from 'axios';

import { isPasswordPolicyError } from '@/modules/auth/lib/sign-up-form.helpers';
import type { ChangePasswordErrorKey } from '@/modules/auth/types/auth.types';

// Status-only mapping (C-UI-AUTH-PAGES change slice): the mismatch case is
// caught client-side by the schema, so ANY 400 ("The provided current password
// is invalid", "must be different", …) folds into the wrong-current-password
// state; 401 is C-AUTH-CHANGE's present-but-invalid/expired Bearer
// (UnauthorizedError "Missing or invalid credentials") → sessionExpired, which
// the form turns into a full session teardown + /sign-in?error=session; 429 is
// the limiter; no response means offline; anything else (including the 403 a
// MISSING Bearer masks into — unreachable from the guarded settings screen) is
// a server fault. Raw Strapi error strings are never rendered. The one message
// branch: a 400 starting "Password policy:" (API PASSWORD_POLICY_ENFORCE on)
// is a weak NEW password, not a wrong current one, so it is checked first.
export function classifyChangePasswordError(error: unknown): ChangePasswordErrorKey {
  if (isAxiosError(error)) {
    if (isPasswordPolicyError(error)) return 'weakPassword';
    if (error.response?.status === 400) return 'wrongCurrentPassword';
    if (error.response?.status === 401) return 'sessionExpired';
    if (error.response?.status === 429) return 'tooManyRequests';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
