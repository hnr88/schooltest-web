'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  RosterGrowthCell,
  RosterPhaseCell,
  RosterStudentCell,
} from '@/modules/teacher/components/RosterStudentCells';
import { ExportButtons } from '@/modules/teacher/components/v2/ExportButtons';
import {
  STUDENTS_COLUMN,
  STUDENTS_COLUMNS,
  STUDENTS_HEAD_CLASS,
  STUDENTS_ROW_CLASS,
  STUDENTS_SCROLL_CLASS,
} from '@/modules/teacher/constants/students-table.constants';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import { useStudentExports } from '@/modules/teacher/hooks/useStudentExports';
import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import type { StudentsResultsTableProps } from '@/modules/teacher/types/students-table.types';

// The Teacher Portal v2 Students table (`:682–716`): a sticky header inside one
// max-height scroll box, one row per student. A scored row opens the student
// page (its name link is stretched over the row) and carries the PDF / LLM
// exports; an unscored row is plain. `student-results-row`, `data-student-id`
// and `data-scored` stay for the specs.
function StudentsResultsTable({ classDocumentId, view }: StudentsResultsTableProps) {
  const t = useTranslations('TeacherPortal.students');
  const tKit = useTranslations('TeacherPortal.kit');
  const tVm = useTranslations('TeacherPortal.viewModel');
  const exports = useStudentExports(classDocumentId);
  const empty = view.total === 0 ? t('emptyRoster') : view.matched === 0 ? t('empty') : null;

  return (
    <div
      role="region"
      aria-label={t('tableLabel')}
      tabIndex={0}
      data-slot="students-scroll"
      className={cn(STUDENTS_SCROLL_CLASS, KIT_FOCUS_RING)}
    >
      <div role="table" aria-label={t('tableLabel')} data-slot="table">
        <div role="row" className={STUDENTS_HEAD_CLASS}>
          {STUDENTS_COLUMNS.map((column) => (
            <span
              key={column}
              role="columnheader"
              className={cn(STUDENTS_COLUMN[column], column === 'export' && 'text-right')}
            >
              {t(`columns.${column}`)}
            </span>
          ))}
        </div>
        {view.rows.map((row) => (
          <div
            key={row.studentDocumentId}
            role="row"
            data-slot="student-results-row"
            data-student-id={row.studentDocumentId}
            data-scored={row.isScored}
            className={cn(STUDENTS_ROW_CLASS, row.isScored && 'hover:bg-[#FAFBFC]')}
          >
            <RosterStudentCell
              row={row}
              href={row.isScored ? studentResultsHref(classDocumentId, row.studentDocumentId) : null}
            />
            <span
              role="cell"
              data-slot="student-score"
              className={cn(
                STUDENTS_COLUMN.score,
                'text-[14px] font-semibold tabular-nums',
                row.score === null ? 'text-[#6B7280]' : 'text-navy-900',
              )}
            >
              {row.score === null ? tKit('noValue') : t('percent', { value: row.score })}
            </span>
            <RosterGrowthCell row={row} />
            <span
              role="cell"
              data-slot="student-weakest"
              className={cn(STUDENTS_COLUMN.weakest, 'text-[13.5px] text-[#4B5563]')}
            >
              {row.weakest === null ? tKit('noValue') : tVm(row.weakest.labelKey)}
            </span>
            <RosterPhaseCell row={row} />
            <span role="cell" className={STUDENTS_COLUMN.export}>
              {row.isScored ? (
                <ExportButtons
                  onPdf={() => exports.downloadPdf(row)}
                  onLlm={() => exports.downloadLlm(row)}
                  pdfTitle={t('pdfTitle')}
                  llmTitle={t('llmTitle')}
                  pdfPending={exports.pdfPendingId === row.studentDocumentId}
                  llmPending={exports.llmPendingId === row.studentDocumentId}
                />
              ) : null}
            </span>
          </div>
        ))}
      </div>
      {empty === null ? null : (
        <p data-slot="students-empty" className="px-2.5 py-12 text-center text-[14px] text-[#6B7280]">
          {empty}
        </p>
      )}
      <div aria-hidden="true" className="pt-2 pb-3.5" />
    </div>
  );
}

export { StudentsResultsTable };
