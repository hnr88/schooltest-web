import { z } from 'zod';

// Messages are Auth-namespace keys (sign-up.schema.ts pattern). Bounds mirror
// C-AUTH-RESET (password min 6 = register bound). `code` is NOT a form field —
// the card injects it from the server page's searchParams at mutate time.
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'passwordTooShort'),
    passwordConfirmation: z.string().min(1, 'confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'passwordMismatch',
    path: ['passwordConfirmation'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
