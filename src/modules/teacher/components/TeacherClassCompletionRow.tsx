'use client';

import { useTranslations } from 'next-intl';

import { CompletionCell } from '@/modules/design-system';
import { completionPercent } from '@/modules/teacher/lib/dashboard-cards';
import type { TeacherClassCompletionRowProps } from '@/modules/teacher/types/teacher-dashboard.types';

// One "Test A 4 / 4" row on a class card. Both numbers are C-TD-1's own
// `{ completed, total }`; the row prints them verbatim and derives nothing but
// the bar width. The count is REPEATED as text next to the track, so the
// progress is never carried by the fill alone (WCAG 2.2 AA, .qa/DESIGN.md).
function TeacherClassCompletionRow({ label, completion }: TeacherClassCompletionRowProps) {
  const t = useTranslations('Teacher.dashboard');
  const display = t('completionValue', {
    completed: completion.completed,
    total: completion.total,
  });

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-meta font-semibold text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        <CompletionCell
          value={completionPercent(completion)}
          display={display}
          ariaLabel={t('completionAria', {
            label,
            completed: completion.completed,
            total: completion.total,
          })}
        />
      </dd>
    </div>
  );
}

export { TeacherClassCompletionRow };
