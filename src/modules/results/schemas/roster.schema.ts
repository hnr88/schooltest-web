import { z } from 'zod';

import { resultViewSchema } from '@schooltest/scoring-contracts';

/**
 * The roster response (spec v2 §6.3, task 23 contract): `GET
 * /api/my/students/results?class=<documentId>` answers one row per roster
 * student, `result: null` where no official Result exists, and — per the
 * contract — `history` is OMITTED on every row. The shared `resultViewSchema`
 * already treats history as optional, so an omitted key parses; a PRESENT one
 * would also parse here, and the aggregation layer never reads it (growth comes
 * from `overall` only — see class-aggregation.ts).
 */
export const rosterStudentSchema = z.strictObject({
  document_id: z.string().min(1),
  name: z.string(),
  initials: z.string(),
  eald_flag: z.boolean(),
});

export const rosterRowSchema = z.strictObject({
  student: rosterStudentSchema,
  result: resultViewSchema.nullable(),
});

export const classRosterResponseSchema = z.array(rosterRowSchema);
