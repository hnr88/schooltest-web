import { isAxiosError } from 'axios';

import type { MfaErrorBody, MfaVerifyFailure } from '@/modules/auth/types/mfa.types';

// W3-20 (D3 MFA-3): status-and-code mapping for POST /api/auth/mfa/verify.
// 400 with details.unlockAt -> locked (the login lockout is shared); any other
// 400 (wrong or replayed code, malformed body) -> invalidCode, carrying
// attemptsRemaining when the API reported it; 403 MFA_NOT_AVAILABLE ->
// notAvailable; 429 -> tooManyRequests; no response -> offline; else server.
// A 400 MFA_NOT_ENROLLED (the account has no secret to verify against) also
// folds into notAvailable: "that code is wrong" would send the person round a
// loop they cannot leave, and the enrol flow is a separate surface. Raw server
// strings select a state and are never rendered.
export function classifyMfaError(error: unknown): MfaVerifyFailure {
  if (!isAxiosError<MfaErrorBody>(error)) return { key: 'server' };
  const status = error.response?.status;
  const details = error.response?.data?.error?.details;
  if (error.response === undefined) return { key: 'offline' };
  if (status === 400) {
    if (typeof details?.unlockAt === 'string' && Number.isFinite(Date.parse(details.unlockAt))) {
      return { key: 'locked', unlockAt: details.unlockAt };
    }
    if (details?.code === 'MFA_NOT_ENROLLED') return { key: 'notAvailable' };
    const remaining = details?.attemptsRemaining;
    if (typeof remaining === 'number' && Number.isInteger(remaining) && remaining > 0) {
      return { key: 'invalidCode', attemptsRemaining: remaining };
    }
    return { key: 'invalidCode' };
  }
  if (status === 403 && details?.code === 'MFA_NOT_AVAILABLE') return { key: 'notAvailable' };
  if (status === 429) return { key: 'tooManyRequests' };
  return { key: 'server' };
}
