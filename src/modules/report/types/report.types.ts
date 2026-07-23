import type { z } from 'zod';

import type {
  attributeStatusSchema,
  cefrBandSchema,
  readinessSchema,
  resultAttributeEntrySchema,
  resultDestinationSchema,
  resultStatusSchema,
  resultSupplementarySchema,
  resultViewBaseSchema,
  resultViewSchema,
  skillSchema,
} from '@/modules/report/schemas/result-view.schema';

export type AttributeStatus = z.infer<typeof attributeStatusSchema>;
export type ReportSkill = z.infer<typeof skillSchema>;
export type CefrBand = z.infer<typeof cefrBandSchema>;
export type Readiness = z.infer<typeof readinessSchema>;
export type ResultStatus = z.infer<typeof resultStatusSchema>;
export type ResultDestination = z.infer<typeof resultDestinationSchema>;
export type ResultAttributeEntry = z.infer<typeof resultAttributeEntrySchema>;
export type ResultSupplementary = z.infer<typeof resultSupplementarySchema>;
export type ResultViewBase = z.infer<typeof resultViewBaseSchema>;
export type ResultView = z.infer<typeof resultViewSchema>;

// Doc 2a s.9: the display label is "primary label from the mastered set with
// jaggedness qualifiers". The server composes both into one string; this is
// the two halves back apart for presentation only.
export interface DisplayLabelParts {
  label: string;
  qualifiers: string[];
}

// 'pending' = a laddered (receptive) result whose scoring has not produced a
// label yet; 'not_applicable' = a result whose skill has no ladder at all.
export type DisplayLabelState = 'derived' | 'pending' | 'not_applicable';

// The resolved display_label as every surface must render it: either the
// server's string, or the ONE absent state that applies — never both, and never
// a stand-in string chosen at the render site.
export type ResolvedDisplayLabel =
  | { state: 'derived'; label: string }
  | { state: 'pending'; label: null; absentKey: 'displayLabelPending' }
  | { state: 'not_applicable'; label: null; absentKey: 'displayLabelNotApplicable' };
