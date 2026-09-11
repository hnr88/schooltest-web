'use client';

import { useTranslations } from 'next-intl';

import { EMPTY_VALUE } from '@/modules/classes/lib/class-detail.helpers';

import type { ClassDetailSummary } from '@/modules/classes/types/class-detail.types';

interface ClassSummaryCardsProps {
  summary: ClassDetailSummary;
}

// Spec §1 summary cards, drawn to the design's stats strip: radius-20 white
// cards in an auto-fit 190px grid, a 12px uppercase eyebrow and a 28px bold
// value. Every figure is C-CLS-05's `summary` verbatim — the only client-side
// work is formatting the "X / Y" fraction and the em dash for a class with no
// completed test. `data-slot="metric-card"` is kept so the surface's summary
// contract (e2e) still resolves these four cards.
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-slot="metric-card"
      className="rounded-result bg-card px-6 py-[22px] shadow-[0_1px_2px_rgba(14,35,80,0.04)]"
    >
      <div className="text-xs font-semibold tracking-[0.05em] text-[#9AA6B8] uppercase">
        {label}
      </div>
      <div className="mt-[9px] text-[28px] font-bold tracking-[-0.02em] text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}

export function ClassSummaryCards({ summary }: ClassSummaryCardsProps) {
  const t = useTranslations('Classes.detail.summary');
  const fraction = (completed: number): string =>
    t('completedFraction', { completed, total: summary.students });

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      <StatCard label={t('students')} value={String(summary.students)} />
      <StatCard label={t('testACompleted')} value={fraction(summary.test_a_completed)} />
      <StatCard label={t('testBCompleted')} value={fraction(summary.test_b_completed)} />
      <StatCard
        label={t('avgReadingScore')}
        value={
          summary.avg_reading_score === null
            ? EMPTY_VALUE
            : t('completedFraction', { completed: summary.avg_reading_score, total: 100 })
        }
      />
    </div>
  );
}
