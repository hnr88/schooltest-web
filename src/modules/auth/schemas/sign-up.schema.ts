import { z } from 'zod';

// Messages are Auth-namespace keys (resolved via useTranslations), mirroring
// sign-in.schema.ts. Bounds match CONTRACTS.md C-AUTH-REGISTER (username 3..20,
// password >=6). confirmPassword is client-only — never sent to the api.
export const signUpSchema = z
  .object({
    username: z.string().min(3, 'usernameTooShort').max(20, 'usernameTooLong'),
    email: z.string().min(1, 'emailRequired').pipe(z.email('emailInvalid')),
    password: z.string().min(6, 'passwordTooShort'),
    confirmPassword: z.string().min(1, 'confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
