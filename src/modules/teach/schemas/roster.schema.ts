import { z } from 'zod';

// Boundary schema for the C-CHD-01 roster row (task 63). Defensive parsing at
// the query boundary; the UI consumes RosterChild from types/roster.types.ts.
export const rosterChildSchema = z.object({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  email: z.string().nullable(),
  status: z.string().nullable(),
  // Task 106 closes the D-18 gap: C-CHD-01 projects the flag since task 103,
  // so the roster row parses it and the pending badge is server-driven.
  email_fix_requested: z.boolean(),
  class: z.object({ documentId: z.string(), name: z.string().nullable() }).nullable(),
});

// C-CHD-05 flag-email-fix response (task 102): the mutation-time confirmation
// that the flag persisted; from the next roster fetch the row's own
// email_fix_requested carries the state.
export const flagEmailFixResponseSchema = z.object({
  documentId: z.string(),
  email_fix_requested: z.literal(true),
});
