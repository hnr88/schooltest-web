import { describe, expect, it } from 'vitest';

import { classifySignInError } from '@/modules/auth/lib/classify-sign-in-error';
import {
  getLoginLockoutDeadline,
  getLoginLockoutRemainingSeconds,
} from '@/modules/auth/lib/login-lockout';

function loginApiError(message: string, details: Record<string, unknown> = {}): unknown {
  return {
    isAxiosError: true,
    response: { status: 400, data: { error: { message, details } } },
  };
}

describe('sign-in lockout contract', () => {
  it('returns a remaining-attempt count only when the API supplies an integer', () => {
    expect(
      classifySignInError(
        loginApiError('Invalid identifier or password', { attemptsRemaining: 4 }),
      ),
    ).toEqual({ key: 'loginError', attemptsRemaining: 4 });
    expect(classifySignInError(loginApiError('Invalid identifier or password'))).toEqual({
      key: 'loginError',
    });
  });

  it('accepts the locked state only with the complete contracted details', () => {
    const unlockAt = '2026-08-31T22:15:00.000Z';
    expect(
      classifySignInError(
        loginApiError('Too many attempts. Your account is locked.', {
          unlockAt,
          retryAfterSeconds: 900,
          attemptsRemaining: 0,
        }),
      ),
    ).toEqual({ key: 'accountLocked', lockout: { unlockAt, retryAfterSeconds: 900 } });
    expect(
      classifySignInError(loginApiError('Too many attempts. Your account is locked.')),
    ).toEqual({ key: 'serverError' });
  });

  it('counts down from the earlier of unlockAt and retryAfterSeconds', () => {
    const receivedAt = Date.parse('2026-08-31T22:00:00.000Z');
    const deadline = getLoginLockoutDeadline(
      { unlockAt: '2026-08-31T22:02:00.000Z', retryAfterSeconds: 90 },
      receivedAt,
    );
    expect(deadline).toBe(receivedAt + 90_000);
    expect(getLoginLockoutRemainingSeconds(deadline, receivedAt + 10_000)).toBe(80);
    expect(getLoginLockoutRemainingSeconds(deadline, receivedAt + 90_000)).toBe(0);
  });
});
