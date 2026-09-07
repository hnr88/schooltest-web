'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { RosterHeadCells } from '@/modules/teacher/components/RosterHeadCells';
import { StudentResultsRow } from '@/modules/teacher/components/StudentResultsRow';
import type { StudentsResultsTableProps } from '@/modules/teacher/types/students-table.types';

// The roster table (task 33, dashboard §2): ONE header row — Student · Score ·
// Growth · Weakest skill · ACARA · Confidence — over the whole class. The v1
// two-level Test A / Test B grouping is gone with the C-TR-1 read it served.
//
// EVERY row the roster sent is rendered — including the result-less ones ("No
// result yet"), which is the point of the task 23 wrapper shape. The
// wireframe's "+ 16 more students" overflow row is a mock-up device; truncating
// a real roster would hide students a teacher must act on.
function StudentsResultsTable({ classDocumentId, rows }: StudentsResultsTableProps) {
  const t = useTranslations('Teacher.results.students');

  return (
    <Table data-slot="students-results-table" className="min-w-3xl">
      <TableCaption className="sr-only">{t('caption')}</TableCaption>
      <TableHeader>
        <TableRow className="border-border">
          <TableHead scope="col" className="px-3 text-meta text-muted-foreground">
            {t('student')}
          </TableHead>
          <RosterHeadCells />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <StudentResultsRow
            key={row.student.document_id}
            classDocumentId={classDocumentId}
            row={row}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export { StudentsResultsTable };
