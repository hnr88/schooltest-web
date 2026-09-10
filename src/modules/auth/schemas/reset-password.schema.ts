import { z } from 'zod';

import {
  hasResetPasswordCharClasses,
  isResetPasswordWithinByteLimit,
} from '@/modules/auth/lib/reset-password-policy';

// Messages are Auth-namespace keys (sign-up.schema.ts pattern). Bounds mirror
// C-AUTH-RESET. `code` is NOT a form field — the card injects it from the
// server page's searchParams at mutate time.
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'passwordRequired')
      .min(12, 'portal.passwordMin')
      .refine(hasResetPasswordCharClasses, 'portal.passwordCharClasses')
      .refine(isResetPasswordWithinByteLimit, 'passwordTooLong'),
    passwordConfirmation: z.string().min(1, 'confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'portal.confirmMismatch',
    path: ['passwordConfirmation'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
