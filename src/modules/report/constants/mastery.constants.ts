import type { StatusPillTone } from '@/modules/design-system';
import type { AssessedAttributeStatus } from '@/modules/report/types/attribute.types';

// NO MASTERY CUT LIVES HERE, DELIBERATELY.
// `Config.status_bands` is `{ mastered_cut: 0.65, emerging_cut: 0.35 }` on the
// active row, and `api::result.assembly` applies it at scoring time, writing the
// resulting band into `Result.attributes.<code>.status`. `api::config.config` is
// admin-only (C-8), so a teacher session cannot read the cuts and must not
// re-derive them. The portal renders the wire `status` and never re-thresholds
// `prob` — which is also why schooltest-app's 0.60/0.40 constants are not ported.
export const ATTRIBUTE_STATUS_TONE: Record<AssessedAttributeStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
};

export const ATTRIBUTE_STATUS_FILL: Record<AssessedAttributeStatus, string> = {
  mastered: 'bg-success',
  emerging: 'bg-warning',
  not_mastered: 'bg-destructive',
};

// Attribute codes are `<letters><number>` for every seeded ladder (R1..R7,
// L1..L7, S1..S5, W1..W6 in `public.crosswalks.attribute_names`). Used for
// deterministic ORDER only — nothing is dropped, nothing is renamed.
export const ATTRIBUTE_CODE_PATTERN = /^([A-Za-z]+)(\d+)$/;

// The narrowest the per-attribute evidence meter may draw a non-zero count, so
// the thinnest evidence in a report is still a visible mark rather than nothing.
export const EVIDENCE_METER_FLOOR = 0.08;
