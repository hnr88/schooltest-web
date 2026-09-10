'use client';

import { useTranslations } from 'next-intl';

import { DIRECTORY_DEFAULT_LABELS, DirectoryEmpty } from '@/modules/directory';
import { useOnlineStatus } from '@/modules/ops';
import { LiveMonitorTile } from '@/modules/teacher/components/LiveMonitorTile';
import type { LiveMonitorGridProps } from '@/modules/teacher/types/live-monitor.types';

// The grid itself — one tile per student on the sitting's class roster, grouped
// by state in the wireframe's order (see `sortMonitorStudents`). Every tile is a
// real C-TS-3 row: a roster with no students renders the empty state rather than
// a grid of placeholders.
//
// ops/34 — the empty state is the KIT's empty arm (same copy, kit chrome), and
// it may only speak while the network is there: with TanStack Query an offline
// read PAUSES (isError stays false and data never arrives), so an offline
// teacher must never be told the roster is empty — the gate keeps the silence
// honest even if the status machine above ever changes. The grid itself stays a
// hand-rolled tile board ON PURPOSE: its data is polled (C-TS-3), and routing
// live rows through the kit's filter pipeline would re-render and reset scroll
// on every tick — the row-action contract and the states are the adoption; the
// refresh behaviour is not.
//
// Fixed responsive columns rather than an arbitrary `minmax()` track, per the
// project's Tailwind rule against arbitrary values.
function LiveMonitorGrid({ students }: LiveMonitorGridProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const online = useOnlineStatus();

  if (students.length === 0) {
    if (!online) return null;
    return (
      <DirectoryEmpty
        variant="none"
        onClearFilters={() => {}}
        labels={{
          ...DIRECTORY_DEFAULT_LABELS,
          emptyNoneTitle: t('rosterEmptyTitle'),
          emptyNoneDescription: t('rosterEmptyDescription'),
        }}
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
