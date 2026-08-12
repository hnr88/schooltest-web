'use client';

import { LineChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import type { ProgressEmptyStateProps } from '@/modules/teacher/types/class-progress.types';

// .qa/DESIGN.md §Progress tab — empty state: the "No progress data yet"
// placeholder, and underneath it the footer
// `Test A: 14 / 21 completed · Test B: 0 / 21 completed`.
//
// This state is the SERVER's `available: false` (C-TR-4: no student has completed
// Test B, or no A/B pair is comparable). The two counts are C-TR-4's own `cohort`,
// so the footer is a measured fact about this class — the panel does not count
// rows itself and shows no zero it invented.
function ProgressEmptyState({ cohort }: ProgressEmptyStateProps) {
  const t = useTranslations('Teacher.results.progress');

  return (
    <section
      data-slot="progress-empty"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <EmptyState
        icon={LineChart}
        tone="brand"
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        className="border-none px-0 py-2"
      />
      <p
        data-slot="progress-empty-counts"
        className="text-center text-meta font-semibold text-body tabular-nums"
      >
        {t('emptyCounts', {
          testA: t('completionValue', { completed: cohort.test_a_completed, total: cohort.total }),
          testB: t('completionValue', { completed: cohort.test_b_completed, total: cohort.total }),
        })}
      </p>
    </section>
  );
}

export { ProgressEmptyState };
