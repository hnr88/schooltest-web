'use client';

import type { ResultView } from '@schooltest/scoring-contracts';

/**
 * Screen C confidence strip (dashboard §4.2). The copy is the spec's verbatim.
 *
 * NULL SEMANTICS (orchestrator ruling): `low_confidence === null` means the SE
 * threshold it derives from is an explicit unknown pending standard setting —
 * "cannot compute", NOT "fine". The same discipline applies to `effort_valid`:
 * the Normal state claims "Effort valid", which a null cannot support. So
 * Normal requires both flags POSITIVELY good; null or false on either renders
 * the warning variant. `duration_minutes === null` drops the trailing segment
 * rather than printing a fabricated duration.
 */
export function ConfidenceStrip({ view }: { view: ResultView }) {
  const normal = view.effort_valid === true && view.low_confidence === false;

  if (!normal) {
    return (
      <p
        data-slot="confidence-strip"
        data-variant="warning"
        data-effort-valid={view.effort_valid === null ? 'unknown' : String(view.effort_valid)}
        data-low-confidence={view.low_confidence === null ? 'unknown' : String(view.low_confidence)}
        role="status"
        className="rounded-tile bg-warning-soft px-3 py-2 text-caption font-semibold text-warning-ink"
      >
        ⚠ Low confidence — results may not reflect this student&apos;s ability
      </p>
    );
  }

  return (
    <p
      data-slot="confidence-strip"
      data-variant="normal"
      role="status"
      className="rounded-tile bg-muted px-3 py-2 text-caption text-muted-foreground"
    >
      Effort valid · Normal confidence · {view.items_answered} of {view.items_total} items answered
      {view.duration_minutes === null ? '' : ` · ${view.duration_minutes} min`}
    </p>
  );
}
