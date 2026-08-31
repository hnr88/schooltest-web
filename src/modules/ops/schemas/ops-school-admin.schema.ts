import { z } from 'zod';

// Boundary schema for the ops school-admins directory read (/api/ops/users,
// school-scoped). Only the columns the Admins tab renders are picked out;
// the user row carries no last-login field, so "last seen" is deliberately
// absent (task 020: the system tracks no last-login; do not invent one).
export const opsSchoolAdminSchema = z.object({
  documentId: z.string().min(1),
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  role: z.string(),
  blocked: z.boolean(),
});

export type OpsSchoolAdmin = z.infer<typeof opsSchoolAdminSchema>;
