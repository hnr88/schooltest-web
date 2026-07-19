import { isAxiosError } from 'axios';

import type { ResetPasswordErrorKey } from '@/modules/auth/types/auth.types';

// Status-only mapping (C-UI-AUTH-PAGES): ANY 400 ("Incorrect code provided",
// "Reset code has expired", …) folds into ONE generic invalid/expired state;
// no response means offline; anything else is a server fault. Raw Strapi
// error strings are never rendered.
export function classifyResetPasswordError(error: unknown): ResetPasswordErrorKey {
  if (isAxiosError(error)) {
    if (error.response?.status === 400) return 'invalidOrExpired';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
