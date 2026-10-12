// W3-20 (D3 MFA-3): the step-up dialog's wire and error types. The wire shapes
// mirror schooltest-api/src/contracts/mfa.ts (C-MFA verify) by hand — there is
// no shared-package change.

/** What the dialog renders. Raw server strings are never rendered. */
export type MfaVerifyErrorKey =
  | 'invalidCode'
  | 'locked'
  | 'notAvailable'
  | 'tooManyRequests'
  | 'offline'
  | 'server';

export interface MfaVerifyFailure {
  key: MfaVerifyErrorKey;
  /** 400 invalidCode only, when the API reported it (the login lockout is shared). */
  attemptsRemaining?: number;
  /** 400 locked only: ISO instant the account unlocks. */
  unlockAt?: string;
}

/** POST /api/auth/mfa/verify success body. */
export interface MfaVerifyResponse {
  jwt: string;
  expiresInSeconds: number;
}

/** Which factor the person is typing. */
export type MfaFactorMode = 'code' | 'recovery';

export interface MfaErrorBody {
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: {
      code?: string;
      attemptsRemaining?: number;
      unlockAt?: string;
      retryAfterSeconds?: number;
    };
  };
}
