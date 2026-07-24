import type { AssessedAttributeStatus } from '@/modules/report/types/attribute.types';
import type { ParentSubskillState } from '@/modules/report/types/report-view.types';

// E11-13 — the ordinal, read top-down as it renders: the three positive steps
// first, then the absence. Ordering the absence last keeps a parent list from
// ever opening on "nothing was measured".
export const PARENT_SUBSKILL_ORDER: readonly ParentSubskillState[] = [
  'secure',
  'getting_there',
  'not_yet',
  'not_assessed',
];

// One-to-one with the wire status. NO CUT IS APPLIED HERE, for the same reason
// `mastery.constants.ts` applies none: `Config.status_bands` is admin-only (C-8)
// and `api::result.assembly` already banded this result at scoring time. This
// re-labels the band for a different audience; it never re-derives it.
export const PARENT_TONE_BY_STATUS: Record<AssessedAttributeStatus, ParentSubskillState> = {
  mastered: 'secure',
  emerging: 'getting_there',
  not_mastered: 'not_yet',
};

// The NON-RED palette E11-13 requires. Success, teal, blue and slate tokens
// only — no danger/destructive token, and no glyph constant anywhere in this
// file: the group marker is a plain tinted dot, never a ✓/✗ pair.
export const PARENT_TONE_SURFACE: Record<ParentSubskillState, string> = {
  secure: 'bg-success-soft-2 text-success-ink',
  getting_there: 'bg-teal-50 text-teal-700',
  not_yet: 'bg-blue-50 text-secondary-foreground',
  not_assessed: 'bg-muted text-secondary-foreground',
};

export const PARENT_TONE_FILL: Record<ParentSubskillState, string> = {
  secure: 'bg-success',
  getting_there: 'bg-teal-500',
  not_yet: 'bg-blue-500',
  not_assessed: 'bg-slate-400',
};
