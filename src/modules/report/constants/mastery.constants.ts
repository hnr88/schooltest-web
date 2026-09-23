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

// The four-step ACARA phase ladder, lowest step first: Beginning (not_yet),
// Emerging, Developing, Consolidating (secure). An ORDER over the wire bands,
// never a cut — the band itself still arrives from the server.
export const PHASE_LADDER_STEPS: readonly AssessedBand[] = ['not_yet', 'emerging', 'developing', 'secure'];

// Solid theme tokens for the reached steps, so a lit step reads clearly against
// the unlit `bg-divider` track.
export const PHASE_LADDER_FILL: Record<AssessedBand, string> = {
  secure: 'bg-success',
  developing: 'bg-blue-500',
  emerging: 'bg-warning',
  not_yet: 'bg-destructive',
};

// The narrowest the per-attribute evidence meter may draw a non-zero count, so
// the thinnest evidence in a report is still a visible mark rather than nothing.
export const EVIDENCE_METER_FLOOR = 0.08;
