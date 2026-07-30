import { z } from 'zod';

// Boundary schema for the C-CHD-01 roster row (task 63). Defensive parsing at
// the query boundary; the UI consumes RosterChild from types/roster.types.ts.
export const rosterChildSchema = z.object({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  email: z.string().nullable(),
  status: z.string().nullable(),
  class: z.object({ documentId: z.string(), name: z.string().nullable() }).nullable(),
});
