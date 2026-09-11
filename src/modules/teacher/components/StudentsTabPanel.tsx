'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StudentsResultsTable } from '@/modules/teacher/components/StudentsResultsTable';
import { PillSearch } from '@/modules/teacher/components/v2/PillSearch';
import { PillSelect } from '@/modules/teacher/components/v2/PillSelect';
import { STUDENTS_SORTS } from '@/modules/teacher/constants/students-table.constants';
import { studentsTabRows } from '@/modules/teacher/lib/v2/students-tab';
import type { StudentsTabPanelProps } from '@/modules/teacher/types/students-table.types';
import type { StudentsSort } from '@/modules/teacher/types/v2-class-tabs.types';

// The Students tab (Teacher Portal v2 `:663–721`). It renders the ONE roster read
// the class detail already made — no second request and no placeholder row; a
// failed read never reaches this panel (ClassResultsScreen renders its error
// branch). Search, the matched count and the four sorts are the design's, over
// `studentsTabRows()`.
function StudentsTabPanel({ classDocumentId, rows }: StudentsTabPanelProps) {
  const t = useTranslations('TeacherPortal.students');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<StudentsSort>('name');
  const view = studentsTabRows(rows, { query, sort });

  return (
    <section
      data-slot="students-tab-panel"
      data-student-count={rows.length}
      className="flex flex-col gap-3.5 leading-[normal]"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <PillSearch
          variant="white"
          size="lg"
          value={query}
          onValueChange={setQuery}
          placeholder={t('searchPlaceholder')}
          label={t('searchLabel')}
        />
        <span role="status" data-slot="students-count" className="ml-auto text-[13px] text-[#6B7280]">
          {t('count', { count: view.matched })}
        </span>
        <PillSelect
          size="xl"
          label={t('sortLabel')}
          value={sort}
          options={STUDENTS_SORTS.map((value) => ({ value, label: t(`sort.${value}`) }))}
          onValueChange={(value) => setSort(STUDENTS_SORTS.find((entry) => entry === value) ?? 'name')}
        />
      </div>
      <StudentsResultsTable classDocumentId={classDocumentId} view={view} />
    </section>
  );
}

export { StudentsTabPanel };
