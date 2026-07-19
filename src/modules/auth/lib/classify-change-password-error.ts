import { isAxiosError } from 'axios';

import type { ChangePasswordErrorKey } from '@/modules/auth/types/auth.types';

// Status-only mapping (C-UI-AUTH-PAGES change slice): the mismatch case is
// caught client-side by the schema, so ANY 400 ("The provided current password
// is invalid", "must be different", …) folds into the wrong-current-password
// state; 429 is the limiter; no response means offline; anything else is a
// server fault. Raw Strapi error strings are never rendered.
export function classifyChangePasswordError(error: unknown): ChangePasswordErrorKey {
  if (isAxiosError(error)) {
    if (error.response?.status === 400) return 'wrongCurrentPassword';
    if (error.response?.status === 429) return 'tooManyRequests';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
