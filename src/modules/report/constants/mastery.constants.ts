import type { StatusPillTone } from '@/modules/design-system';
import type { AssessedBand } from '@/modules/report/schemas/result-view.schema';

// NO BAND CUT LIVES HERE, DELIBERATELY.
// Bands are computed server-side and arrive on the wire as
// `ResultView.attributes.<name>.status`; the portal renders them verbatim and
// never re-thresholds a score.
export const ATTRIBUTE_STATUS_TONE: Record<AssessedBand, StatusPillTone> = {
  secure: 'success',
  developing: 'info',
  emerging: 'warning',
  not_yet: 'danger',
};

// Soft fills mirror the subskill card idiom so a report row and Screen C read
// as one system.
export const ATTRIBUTE_STATUS_FILL: Record<AssessedBand, string> = {
  secure: 'bg-success-soft text-success-ink',
  developing: 'bg-info-soft text-info-ink',
  emerging: 'bg-warning-soft text-warning-ink',
  not_yet: 'bg-danger-soft text-danger-ink',
};

// The narrowest the per-attribute evidence meter may draw a non-zero count, so
// the thinnest evidence in a report is still a visible mark rather than nothing.
export const EVIDENCE_METER_FLOOR = 0.08;
