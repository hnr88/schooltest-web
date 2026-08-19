import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'nameRequired'),
  school: z.string().trim().min(2, 'schoolRequired'),
  role: z.string().trim().min(1, 'roleRequired'),
  email: z.string().trim().min(1, 'emailRequired').pipe(z.email('emailInvalid')),
  students: z.string().trim().min(1, 'studentsRequired'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
