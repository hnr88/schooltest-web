'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { StudentsResultsTable } from '@/modules/teacher/components/StudentsResultsTable';
import type { StudentsTabPanelProps } from '@/modules/teacher/types/students-table.types';

// The Students tab. It renders the `students` array of the ONE C-TR-1 read the
// class-detail screen already made — no second request, no client-side merge and
// no placeholder row: an empty array is only ever an EMPTY ROSTER, because a
// failed read never reaches this panel (ClassResultsScreen renders its error
// branch instead).
function StudentsTabPanel({ classDocumentId, students }: StudentsTabPanelProps) {
  const t = useTranslations('Teacher.results.students');

  return (
    <section
      data-slot="students-tab-panel"
      data-student-count={students.length}
      aria-labelledby="students-tab-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-4 py-6 shadow-sm sm:px-6"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="students-tab-heading" className="text-panel-title font-semibold text-foreground">
          {t('title')}
        </h2>
        <p className="text-meta text-muted-foreground">{t('hint')}</p>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="border-none px-0 py-2"
        />
      ) : (
        <StudentsResultsTable classDocumentId={classDocumentId} students={students} />
      )}
    </section>
  );
}

export { StudentsTabPanel };
