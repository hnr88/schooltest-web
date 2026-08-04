'use client';

import { useTranslations } from 'next-intl';

import { studentDisplayName } from '@/modules/test-day/lib/monitor-row-state';
import type { MonitorStudent } from '@/modules/test-day/types/test-day.types';

import type { NeedsToSitPanelProps } from '@/modules/test-day/types/components.types';

// Who still needs to sit (task 121, mvp-updates §4.5.6, contract C-SIT-02):
// a pure projection of the monitor payload the screen already polls, so no
// new fetch. The server derives needs_to_sit (not_joined or stalled, never
// absent, C-SIT-06), so absentees drop out the moment the toggle lands and
// the count falls as students join and submit. Names follow the MonitorTable
// roster convention.
export function NeedsToSitPanel({ students }: NeedsToSitPanelProps) {
  const t = useTranslations('TestDay.needsToSit');
  const pending = students.filter((student) => student.needs_to_sit);

  return (
    <section
      data-slot="needs-to-sit-panel"
      aria-label={t('title')}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4"
    >
      <h3 className="text-sm font-semibold text-foreground">
        {t('count', { count: pending.length })}
      </h3>
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((student) => (
            <li key={student.documentId} className="text-sm text-body">
              {studentDisplayName(student)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
