import { describe, expect, it } from 'vitest';

import { classifyChangePasswordError } from '@/modules/auth/lib/classify-change-password-error';
import { classifyResetPasswordError } from '@/modules/auth/lib/classify-reset-password-error';
import { classifyError as classifySignUpError } from '@/modules/auth/lib/sign-up-form.helpers';

// Axios-shaped error as the interceptor chain hands it to the classifiers.
function apiError(status: number | undefined, message?: string): unknown {
  return {
    isAxiosError: true,
    response:
      status === undefined
        ? undefined
        : { status, data: message === undefined ? {} : { error: { message } } },
  };
}

const POLICY = 'Password policy: is too common';

describe('server password policy messages (PASSWORD_POLICY_ENFORCE on)', () => {
  it('change password: a policy 400 is weakPassword, not wrongCurrentPassword', () => {
    expect(classifyChangePasswordError(apiError(400, POLICY))).toBe('weakPassword');
  });

  it('change password: other statuses keep their previous key', () => {
    expect(
      classifyChangePasswordError(apiError(400, 'The provided current password is invalid')),
    ).toBe('wrongCurrentPassword');
    expect(classifyChangePasswordError(apiError(400))).toBe('wrongCurrentPassword');
    expect(classifyChangePasswordError(apiError(401, 'Missing or invalid credentials'))).toBe(
      'sessionExpired',
    );
    expect(classifyChangePasswordError(apiError(429))).toBe('tooManyRequests');
    expect(classifyChangePasswordError(apiError(undefined))).toBe('offlineError');
    expect(classifyChangePasswordError(apiError(500))).toBe('serverError');
  });

  it('sign up: a policy 400 is weakPassword, other 400s stay takenError', () => {
    expect(classifySignUpError(apiError(400, POLICY))).toBe('weakPassword');
    expect(classifySignUpError(apiError(400, 'Email or Username are already taken'))).toBe(
      'takenError',
    );
    expect(classifySignUpError(apiError(400, 'Password validation failed.'))).toBe('takenError');
    expect(classifySignUpError(apiError(400))).toBe('takenError');
    expect(classifySignUpError(apiError(undefined))).toBe('offlineError');
    expect(classifySignUpError(apiError(500))).toBe('registerError');
  });

  it('reset: a policy 400 is weakPassword, not the invalid/expired link state', () => {
    expect(classifyResetPasswordError(apiError(400, POLICY))).toBe('weakPassword');
  });

  it('reset: other responses keep their previous key', () => {
    expect(classifyResetPasswordError(apiError(400, 'Incorrect code provided'))).toBe(
      'invalidOrExpired',
    );
    expect(classifyResetPasswordError(apiError(400, 'Reset code has expired'))).toBe('expiredLink');
    expect(classifyResetPasswordError(apiError(undefined))).toBe('offlineError');
    expect(classifyResetPasswordError(apiError(500))).toBe('serverError');
  });

  it('only a 400 carrying the prefix counts (prefix elsewhere or other status is ignored)', () => {
    expect(classifyChangePasswordError(apiError(500, POLICY))).toBe('serverError');
    expect(classifyChangePasswordError(apiError(400, `x ${POLICY}`))).toBe('wrongCurrentPassword');
    expect(classifyResetPasswordError(apiError(500, POLICY))).toBe('serverError');
  });
});
