import { z } from 'zod';

import { isResetPasswordWithinByteLimit } from '@/modules/auth/lib/reset-password-policy';

// Messages are Auth-namespace keys (sign-up.schema.ts pattern). Bounds mirror
// C-AUTH-RESET. `code` is NOT a form field — the card injects it from the
// server page's searchParams at mutate time.
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'passwordRequired')
      .refine(isResetPasswordWithinByteLimit, 'passwordTooLong'),
    passwordConfirmation: z.string().min(1, 'confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'passwordMismatch',
    path: ['passwordConfirmation'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
