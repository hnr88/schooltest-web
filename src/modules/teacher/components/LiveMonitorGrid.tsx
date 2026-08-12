'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { LiveMonitorTile } from '@/modules/teacher/components/LiveMonitorTile';
import type { LiveMonitorGridProps } from '@/modules/teacher/types/live-monitor.types';

// The grid itself — one tile per student on the sitting's class roster, grouped
// by state in the wireframe's order (see `sortMonitorStudents`). Every tile is a
// real C-TS-3 row: a roster with no students renders the empty state rather than
// a grid of placeholders.
//
// Fixed responsive columns rather than an arbitrary `minmax()` track, per the
// project's Tailwind rule against arbitrary values.
function LiveMonitorGrid({ students }: LiveMonitorGridProps) {
  const t = useTranslations('Teacher.testSessions.live');

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('rosterEmptyTitle')}
        description={t('rosterEmptyDescription')}
        className="border-none px-0 py-2"
      />
    );
  }

  return (
    <ul
      data-slot="live-monitor-grid"
      aria-label={t('gridLabel')}
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {students.map((student) => (
        <LiveMonitorTile key={student.student_document_id} student={student} />
      ))}
    </ul>
  );
}

export { LiveMonitorGrid };
