/**
 * MIRROR of schooltest-api/src/contracts/my-lists.ts — the class roster form of
 * `GET /api/my/students/results` (task 23 contract; U-43). Update the mirror in
 * the same task as the api contract, never server-first: both row schemas are
 * strictObject, so a widened server with a narrow mirror 500s the roster on its
 * own client.
 *
 * The roster response (spec v2 §6.3): `GET
 * /api/my/students/results?class=<documentId>` answers one row per roster
 * student, `result: null` where no official Result exists.
 *
 * SCORING/10 (mirrored from the api contract): `history[]` is now PRESENT
 * inside a v2 row's `result` — the package's `resultHistoryPointSchema` window,
 * capped at 8 points, oldest first — and `release_state` sits ON THE ROW beside
 * `result`: the result-grain arm (`held|released|recalled|manual`) when the
 * student has a Result, else the session-grain arm (`absent|open|nosit`)
 * derived from their latest session. The legacy bare-array form (no `class`)
 * still omits `history` and carries no `release_state`.
 */
import { z } from 'zod';

import { resultViewSchema } from '@schooltest/scoring-contracts';

export const rosterStudentSchema = z.strictObject({
  document_id: z.string().min(1),
  name: z.string(),
  initials: z.string(),
  eald_flag: z.boolean(),
});

/** Mirrors `rosterReleaseStateSchema` in the api contract — same seven arms, same order. */
export const rosterReleaseStateSchema = z.enum([
  'held',
  'released',
  'recalled',
  'manual',
  'absent',
  'open',
  'nosit',
]);
export type RosterReleaseState = z.infer<typeof rosterReleaseStateSchema>;

export const rosterRowSchema = z.strictObject({
  student: rosterStudentSchema,
  result: resultViewSchema.nullable(),
  release_state: rosterReleaseStateSchema,
});

export const classRosterResponseSchema = z.array(rosterRowSchema);
