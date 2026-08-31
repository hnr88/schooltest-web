import { isAxiosError } from 'axios';

import type { SignInFailure, StrapiErrorBody } from '@/modules/auth/types/auth.types';

// C-AUTH-LOGIN sanctions exact message branches for confirmation and lockout.
// Raw server strings select translated states but are never rendered.
export function classifySignInError(error: unknown): SignInFailure {
  if (isAxiosError<StrapiErrorBody>(error)) {
    const serverError = error.response?.data?.error;
    const details = serverError?.details;
    if (
      error.response?.status === 400 &&
      serverError?.message === 'Too many attempts. Your account is locked.'
    ) {
      const { attemptsRemaining, retryAfterSeconds, unlockAt } = details ?? {};
      if (
        attemptsRemaining === 0 &&
        Number.isInteger(retryAfterSeconds) &&
        typeof retryAfterSeconds === 'number' &&
        retryAfterSeconds > 0 &&
        typeof unlockAt === 'string' &&
        Number.isFinite(Date.parse(unlockAt))
      ) {
        return { key: 'accountLocked', lockout: { retryAfterSeconds, unlockAt } };
      }
      return { key: 'serverError' };
    }
    if (
      error.response?.status === 400 &&
      serverError?.message === 'Your account email is not confirmed'
    ) {
      return { key: 'notConfirmedError' };
    }
    if (error.response?.status === 400) {
      const attemptsRemaining = details?.attemptsRemaining;
      if (
        Number.isInteger(attemptsRemaining) &&
        typeof attemptsRemaining === 'number' &&
        attemptsRemaining > 0
      ) {
        return { key: 'loginError', attemptsRemaining };
      }
      return { key: 'loginError' };
    }
    if (error.response === undefined) return { key: 'offlineError' };
  }
  return { key: 'serverError' };
}
