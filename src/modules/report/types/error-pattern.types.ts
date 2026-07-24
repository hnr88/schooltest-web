import type { z } from 'zod';

import type {
  diagnosticBundleSchema,
  diagnosticSkillEntrySchema,
} from '@/modules/report/schemas/diagnostic-bundle.schema';

export type DiagnosticBundle = z.infer<typeof diagnosticBundleSchema>;
export type DiagnosticSkillEntry = z.infer<typeof diagnosticSkillEntrySchema>;

// E11-07. `none_observed` is a MEASURED absence — the aggregator ran over this
// sitting's responses and no distractor type was chosen on enough items to name
// a pattern. It is a different statement from `not_applicable` (the bundle
// carries no skill block at all), and both are different from the query having
// failed, which the component reports as its own state rather than as an empty
// list.
export type ErrorPatternsView =
  | { state: 'patterns'; skills: { skill: string; patterns: string[] }[] }
  | { state: 'none_observed'; skills: string[] }
  | { state: 'not_applicable' };
