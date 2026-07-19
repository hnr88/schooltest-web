import { z } from 'zod';

// Messages are Auth-namespace keys (reset-password.schema.ts pattern). Bounds
// mirror C-AUTH-CHANGE (password min 6 = register bound); the mismatch check
// runs client-side so a "Passwords do not match" 400 never reaches the API.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPasswordRequired'),
    password: z.string().min(6, 'passwordTooShort'),
    passwordConfirmation: z.string().min(1, 'confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'passwordMismatch',
    path: ['passwordConfirmation'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
