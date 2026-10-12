import { isAxiosError } from 'axios';

import { isPasswordPolicyError } from '@/modules/auth/lib/sign-up-form.helpers';
import type { ResetPasswordErrorKey, StrapiErrorBody } from '@/modules/auth/types/auth.types';

// C-AUTH-RESET exposes one sanctioned message branch: only the exact expiry
// message can distinguish a timed-out code from the shared wrong/reused-code
// response. A 400 starting "Password policy:" (API PASSWORD_POLICY_ENFORCE on)
// is a weak new password: a form-level error, not an invalid/expired link.
// Raw Strapi strings select a translated state but are never shown.
export function classifyResetPasswordError(error: unknown): ResetPasswordErrorKey {
  if (isAxiosError<StrapiErrorBody>(error)) {
    if (
      error.response?.status === 400 &&
      error.response.data?.error?.message === 'Reset code has expired'
    ) {
      return 'expiredLink';
    }
    if (isPasswordPolicyError(error)) return 'weakPassword';
    if (error.response?.status === 400) return 'invalidOrExpired';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
