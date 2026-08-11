'use client';

import { useTranslations } from 'next-intl';

import { ProgressStatCell } from '@/modules/teacher/components/ProgressStatCell';
import { useDrillDownComparison } from '@/modules/teacher/hooks/useDrillDownComparison';
import type { StudentComparisonStripProps } from '@/modules/teacher/types/student-drill-down.types';

// .qa/DESIGN.md §Both tests completed — "A comparison strip FIRST: Overall score
// 72 → 81 ↑9, ACARA phase Developing → Consolidating, 5 subskills improved · 2
// stable · 0 regressed". It sits above both test cards, on the same label / value
// / delta-pill anatomy the Progress tab and the class header already use.
//
// It renders ONLY when C-TR-2 sent a `progress` object. `progress` is `null` until
// both tests are complete AND the A/B pair is comparable (.qa/CONTRACTS.md
// F-EQUATING-GATE), so the absence of this strip is itself the contract's answer —
// nothing here fabricates a comparison the server declined to report, and no
// zero-filled strip stands in for a suppressed one.
function StudentComparisonStrip({ progress, earlier, latest }: StudentComparisonStripProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const stats = useDrillDownComparison({ progress, earlier, latest });

  return (
    <section
      data-slot="student-comparison-strip"
      data-from={earlier.variant}
      data-to={latest.variant}
      aria-labelledby="drill-down-comparison-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-4 py-6 shadow-sm sm:px-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="drill-down-comparison-heading"
          className="text-panel-title font-semibold text-foreground"
        >
          {t('comparisonHeading', { from: earlier.variant, to: latest.variant })}
        </h2>
        <p data-slot="comparison-note" className="text-meta text-balance text-muted-foreground">
          {t('comparisonNote')}
        </p>
      </div>

      <dl aria-label={t('comparisonStatsLabel')} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((item) => (
          <ProgressStatCell key={item.key} item={item} />
        ))}
      </dl>
    </section>
  );
}

export { StudentComparisonStrip };
