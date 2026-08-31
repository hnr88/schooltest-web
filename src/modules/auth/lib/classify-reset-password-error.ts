import { isAxiosError } from 'axios';

import type { ResetPasswordErrorKey, StrapiErrorBody } from '@/modules/auth/types/auth.types';

// C-AUTH-RESET exposes one sanctioned message branch: only the exact expiry
// message can distinguish a timed-out code from the shared wrong/reused-code
// response. Raw Strapi strings select a translated state but are never shown.
export function classifyResetPasswordError(error: unknown): ResetPasswordErrorKey {
  if (isAxiosError<StrapiErrorBody>(error)) {
    if (
      error.response?.status === 400 &&
      error.response.data?.error?.message === 'Reset code has expired'
    ) {
      return 'expiredLink';
    }
    if (error.response?.status === 400) return 'invalidOrExpired';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
