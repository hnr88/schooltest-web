import { isAxiosError } from 'axios';

import type { SignInErrorKey, StrapiErrorBody } from '@/modules/auth/types/auth.types';

// Status-only mapping (C-AUTH-LOGIN) with ONE sanctioned message-based branch:
// a 400 whose body message is exactly 'Your account email is not confirmed'
// renders the distinct confirm-your-email-first state — status alone cannot
// separate it from bad credentials, so C-AUTH-LOGIN explicitly sanctions this
// message check. (With sign-up resend's "Already confirmed" these are the only
// two sanctioned message-based branches.) Every other 400 stays the single
// loginError; no response means offline; anything else is a server fault. Raw
// Strapi error strings are never rendered.
export function classifySignInError(error: unknown): SignInErrorKey {
  if (isAxiosError<StrapiErrorBody>(error)) {
    if (
      error.response?.status === 400 &&
      error.response.data?.error?.message === 'Your account email is not confirmed'
    ) {
      return 'notConfirmedError';
    }
    if (error.response?.status === 400) return 'loginError';
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
