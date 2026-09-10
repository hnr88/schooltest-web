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

  it('enforces the 12-character minimum, digit+symbol rule and 72-byte ceiling', () => {
    const tooShort = resetPasswordSchema.safeParse({
      password: 'Ab1!a'.padEnd(11, 'a'),
      passwordConfirmation: 'Ab1!a'.padEnd(11, 'a'),
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) expect(tooShort.error.issues[0]?.message).toBe('portal.passwordMin');

    const noCharClasses = resetPasswordSchema.safeParse({
      password: 'a'.repeat(12),
      passwordConfirmation: 'a'.repeat(12),
    });
    expect(noCharClasses.success).toBe(false);
    if (!noCharClasses.success)
      expect(noCharClasses.error.issues[0]?.message).toBe('portal.passwordCharClasses');

    const valid = resetPasswordSchema.safeParse({
      password: 'a'.repeat(11) + '1!',
      passwordConfirmation: 'a'.repeat(11) + '1!',
    });
    expect(valid.success).toBe(true);

    const mismatch = resetPasswordSchema.safeParse({
      password: 'a'.repeat(11) + '1!',
      passwordConfirmation: 'b'.repeat(11) + '1!',
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(mismatch.error.issues[0]?.message).toBe('portal.confirmMismatch');

    const overCeiling = resetPasswordSchema.safeParse({
      password: `Ab1!${'a'.repeat(69)}`,
      passwordConfirmation: `Ab1!${'a'.repeat(69)}`,
    });
    expect(overCeiling.success).toBe(false);
    if (!overCeiling.success) expect(overCeiling.error.issues[0]?.message).toBe('passwordTooLong');
  });
});
