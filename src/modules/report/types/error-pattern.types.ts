import type { DiagnosticExport, ErrorPattern } from '@/modules/report/schemas/result-view.schema';

export type { DiagnosticExport, ErrorPattern };

// E11-07. `none_observed` is a MEASURED absence — the aggregator ran over this
// sitting's responses and no distractor type was chosen on enough items to name
// a pattern. It is a different statement from `not_applicable` (a legacy-model
// result carries no diagnostic bundle at all), and both are different from the
// query having failed, which the component reports as its own state rather than
// as an empty list.
export type ErrorPatternsView =
  | { state: 'patterns'; patterns: ErrorPattern[] }
  | { state: 'none_observed' }
  | { state: 'not_applicable' };
