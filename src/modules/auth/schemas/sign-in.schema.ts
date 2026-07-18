import { z } from 'zod';

// Messages are Auth-namespace keys (Auth.emailRequired / emailInvalid /
// passwordRequired) — the form resolves them through useTranslations.
export const signInSchema = z.object({
  email: z.string().min(1, 'emailRequired').pipe(z.email('emailInvalid')),
  password: z.string().min(1, 'passwordRequired'),
});

export type SignInInput = z.infer<typeof signInSchema>;
