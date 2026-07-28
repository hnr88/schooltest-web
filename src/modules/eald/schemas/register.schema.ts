import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'nameRequired'),
  school: z.string().min(2, 'schoolRequired'),
  role: z.string().min(1, 'roleRequired'),
  email: z.string().min(1, 'emailRequired').pipe(z.email('emailInvalid')),
  students: z.string().min(1, 'studentsRequired'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
