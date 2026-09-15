import { AxiosError } from 'axios';
import { describe, expect, test } from 'vitest';

import { classifyRestFailure } from '@schooltest/ops-contracts';

import { isAuthRejection } from '@/modules/auth/queries/use-me.query';

// NIGHT-2 (W-R3): the portal guards used to sign the user OUT on ANY me-query
// error. Observed live under fleet load: sign-in succeeded (JWT stored), the
// first /users/me on the next page hiccuped once, and the guard bounced an
// authenticated admin to the login form. The fix: only a genuine auth
// rejection ends the session; transport resets, exhausted 429s and 5xx
// contract failures are transient and must recover in place. This file pins
// the boundary so a future edit cannot widen "error" back into "logged out".

function classifiedError(status: number | undefined): AxiosError {
  const error = new AxiosError(
    'request failed',
    status === undefined ? 'ERR_NETWORK' : 'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    status === undefined ? undefined : ({ status } as never),
  );
  // The strapi axios response interceptor attaches this before rejecting.
  (error as AxiosError & { restFailure?: unknown }).restFailure = classifyRestFailure({
    status: status ?? null,
    body: null,
    tokenWasAttached: true,
  });
  return error;
}

describe('isAuthRejection — transient me failures are not sign-outs', () => {
  test('a 401 (auth-invalid) IS a session end', () => {
    expect(isAuthRejection(classifiedError(401))).toBe(true);
  });

  test('a 403 without a token (auth-missing) IS a session end', () => {
    const error = classifiedError(403);
    (error as AxiosError & { restFailure?: unknown }).restFailure = classifyRestFailure({
      status: 403,
      body: null,
      tokenWasAttached: false,
    });
    expect(isAuthRejection(error)).toBe(true);
  });

  test('a transport reset (no response) is transient', () => {
    expect(isAuthRejection(classifiedError(undefined))).toBe(false);
  });

  test('a 429 (rate-limited) is transient', () => {
    expect(isAuthRejection(classifiedError(429))).toBe(false);
  });

  test('a 502 (contract) during a recompile window is transient', () => {
    expect(isAuthRejection(classifiedError(502))).toBe(false);
  });
});
