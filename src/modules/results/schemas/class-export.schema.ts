/**
 * MIRROR of `schooltest-api/src/contracts/diagnostic-export.ts` — the CLASS
 * variant of `GET /api/classes/{documentId}/export?format=diagnostic_json`
 * (`C-CLASS-EXPORT`). Update the mirror in the same task as the api contract,
 * never server-first: every object here is `strictObject`, so a widened server
 * against a narrow mirror fails the parse on its own client.
 *
 * THE BUNDLE IS COMPOSED, NEVER RE-DECLARED. The per-student `bundle` is the
 * package's `diagnosticExportSchema` itself — the same declaration the
 * single-result export hook parses. A second description of that wire would be
 * the duplicate SHARED-LAYER §11 forbids, and it is how a posterior field
 * eventually gets admitted on one side only.
 *
 * The arms are a plain `z.union`, NOT `discriminatedUnion`: the second arm's
 * `state` carries TWO literals (`awaiting_publication`, `no_official_result`)
 * and so cannot key a discriminator.
 *
 * Doc 0 hard constraint, restated because the payload restates it: nothing is
 * aggregated across students or skills — this is the per-student bundles side by
 * side, and `caveats` is `.min(1)` so the hedging travels with the data rather
 * than living in a screen.
 */
import { z } from 'zod';

import { diagnosticExportSchema } from '@schooltest/scoring-contracts';

const str = z.string().min(1);

/**
 * One roster row. A student the server has nothing to export for is listed with
 * the REASON — never a stand-in bundle, an empty bundle or a placeholder string.
 * `student_key` is the only student identifier on this wire (Doc 1 s.11).
 */
export const classExportStudentSchema = z.union([
  z.strictObject({
    student_key: str,
    state: z.literal('exported'),
    bundle: diagnosticExportSchema,
  }),
  z.strictObject({
    student_key: str,
    state: z.enum(['awaiting_publication', 'no_official_result']),
  }),
]);
export type ClassExportStudent = z.infer<typeof classExportStudentSchema>;

/**
 * `student_count` is the non-archived roster size every count is stated
 * against; `exported_count` is how many of those produced a bundle.
 */
export const classExportSchema = z.strictObject({
  class: z.strictObject({
    name: str,
    year_band: z.string().nullable(),
    student_count: z.number().int().min(0),
    exported_count: z.number().int().min(0),
  }),
  students: z.array(classExportStudentSchema),
  caveats: z.array(z.string()).min(1),
});
export type ClassExport = z.infer<typeof classExportSchema>;
