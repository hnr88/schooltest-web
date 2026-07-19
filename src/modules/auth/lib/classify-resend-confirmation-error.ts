import { isAxiosError } from 'axios';

import type {
  ResendConfirmationErrorKey,
  StrapiErrorBody,
} from '@/modules/auth/types/auth.types';

// 429 is the rate-limit branch (2/hour/email, shared with the register-time
// send — C-AUTH-SEND-CONFIRM). ONE sanctioned message-based branch: a 400
// whose body message is exactly 'Already confirmed' renders the info state
// linking to /sign-in. (With sign-in's unconfirmed-login check these are the
// only two sanctioned message-based branches.) Everything else stays
// status-only; raw Strapi error strings are never rendered.
export function classifyResendConfirmationError(error: unknown): ResendConfirmationErrorKey {
  if (isAxiosError<StrapiErrorBody>(error)) {
    if (error.response?.status === 429) return 'tooManyRequests';
    if (
      error.response?.status === 400 &&
      error.response.data?.error?.message === 'Already confirmed'
    ) {
      return 'alreadyConfirmed';
    }
    if (error.response === undefined) return 'offlineError';
  }
  return 'serverError';
}
