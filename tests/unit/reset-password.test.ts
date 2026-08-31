import { describe, expect, it } from 'vitest';

import { classifyResetPasswordError } from '@/modules/auth/lib/classify-reset-password-error';
import { isResetPasswordWithinByteLimit } from '@/modules/auth/lib/reset-password-policy';
import { resetPasswordSchema } from '@/modules/auth/schemas/reset-password.schema';

function resetApiError(message: string): unknown {
  return {
    isAxiosError: true,
    response: { status: 400, data: { error: { message } } },
  };
}

describe('reset password contract', () => {
  it('distinguishes an expired code from an incorrect code', () => {
    expect(classifyResetPasswordError(resetApiError('Reset code has expired'))).toBe(
      'expiredLink',
    );
    expect(classifyResetPasswordError(resetApiError('Incorrect code provided'))).toBe(
      'invalidOrExpired',
    );
  });

  it('applies the server 72-byte ceiling to ASCII and multibyte passwords', () => {
    expect(isResetPasswordWithinByteLimit('a'.repeat(72))).toBe(true);
    expect(isResetPasswordWithinByteLimit('a'.repeat(73))).toBe(false);
    expect(isResetPasswordWithinByteLimit('😀'.repeat(18))).toBe(true);
    expect(isResetPasswordWithinByteLimit('😀'.repeat(19))).toBe(false);
  });

  it('does not invent a minimum length and rejects passwords over 72 bytes', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'a', passwordConfirmation: 'a' }).success,
    ).toBe(true);
    const result = resetPasswordSchema.safeParse({
      password: 'a'.repeat(73),
      passwordConfirmation: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('passwordTooLong');
  });
});
