import { z } from 'zod';

// Messages are Auth-namespace keys (Auth.emailRequired / emailInvalid) — the
// form resolves them through useTranslations (sign-in.schema.ts pattern).
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'emailRequired').pipe(z.email('emailInvalid')),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
