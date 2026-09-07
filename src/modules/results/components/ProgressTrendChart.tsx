'use client';

import type { ResultView } from '@schooltest/scoring-contracts';

/**
 * Screen C trend chart (dashboard §4.3): `history[].overall` vs `sat_at`.
 *
 * One sitting → a single dot plus the first-sitting caption; no line (a line
 * through one point fabricates a trend). Two or more → a plain SVG polyline
 * over the real points, oldest first (the contract guarantees the order).
 *
 * ACARA BAND GUIDE-LINES ARE DELIBERATELY ABSENT (task 30 report): the spec
 * draws them at "positions from Crosswalk display config", but the crosswalk's
 * label_rules are cuts on the posterior PROB (0.8/0.5/0.2), and the Y axis here
 * is a DOMAIN SCORE — no contract maps one onto the other, and hardcoding a
 * mapping would be an invented standard-setting value (house rule 5). The lines
 * arrive with the config endpoint; the axis notes that below.
 */
export function ProgressTrendChart({ view }: { view: ResultView }) {
  const history = view.history ?? [];
  if (history.length === 0) return null;

  const scores = history.map((point) => point.overall).filter((s): s is number => s !== null);
  const top = Math.max(...scores, 100);
  const bottom = Math.min(...scores, 0);
  const span = Math.max(top - bottom, 1);
  const y = (score: number): number => 100 - ((score - bottom) / span) * 100;
  const points = history
    .map((point, index) => (point.overall === null ? null : `${(index / Math.max(history.length - 1, 1)) * 100},${y(point.overall)}`))
    .filter((p): p is string => p !== null)
    .join(' ');

  const first = new Date(history[0].sat_at);
  const firstMonth = first.toLocaleString('en', { month: 'long', year: 'numeric' });
  const best = bestReliableGain(view);

  return (
    <section data-slot="progress-trend" aria-label="Reading progress over time" className="flex flex-col gap-2">
      <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">Reading progress over time</h2>

      {history.length === 1 ? (
        <p data-slot="trend-first-sitting" className="text-caption text-muted-foreground">
          First sitting — trend appears from the second test
        </p>
      ) : (
        <svg data-slot="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" className="h-24 w-full" role="img">
          {/* Y axis is the domain score; guide lines wait on a crosswalk display config (see block comment). */}
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {history.map((point, index) =>
            point.overall === null ? null : (
              <circle
                key={point.sat_at}
                cx={(index / Math.max(history.length - 1, 1)) * 100}
                cy={y(point.overall)}
                r="1.5"
                className="fill-primary"
              />
            ),
          )}
        </svg>
      )}

      <p data-slot="trend-summary" className="text-caption text-muted-foreground">
        {history.length} sitting{history.length === 1 ? '' : 's'} since {firstMonth}
        {view.overall.delta_display !== null
          ? ` · ${view.overall.delta_display === 'band_movement' ? 'band movement' : `${view.overall.delta_display} pts`} (${view.overall.delta_reliable ? 'reliable' : 'within error'})`
          : ''}
        {best !== null ? ` · Best gain: ${best.skill} +${best.delta} pts` : ''}
      </p>
    </section>
  );
}

/** §4.3 "Best gain": the largest RELIABLE positive attribute delta; omitted when none qualifies. */
function bestReliableGain(view: ResultView): { skill: string; delta: number } | null {
  let best: { skill: string; delta: number } | null = null;
  for (const [skill, attribute] of Object.entries(view.attributes)) {
    if (attribute.status === 'not_assessed') continue;
    if (attribute.delta_reliable === true && attribute.delta !== null && (best === null || attribute.delta > best.delta)) {
      best = { skill, delta: attribute.delta };
    }
  }
  return best;
}
