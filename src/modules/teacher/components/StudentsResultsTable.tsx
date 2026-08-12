'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { StudentResultsRow } from '@/modules/teacher/components/StudentResultsRow';
import { StudentTestHeadCells } from '@/modules/teacher/components/StudentTestHeadCells';
import { STUDENTS_TABLE_GROUP_EDGE_CLASS } from '@/modules/teacher/constants/students-table.constants';
import type { StudentsResultsTableProps } from '@/modules/teacher/types/students-table.types';

// .qa/DESIGN.md §Students tab: a TWO-LEVEL header where Test A and Test B each
// span Status · Score · ACARA. Real <th>s throughout — `rowSpan` + `scope="col"`
// on Student, `colSpan={3}` + `scope="colgroup"` on each test, `scope="col"` on
// the six sub-headers and `scope="row"` on every student name.
//
// EVERY row the server sent is rendered. The wireframe's "+ 16 more students"
// overflow row is a mock-up device for a 21-student roster; truncating a real
// roster would hide students a teacher must act on, so it is not reproduced.
function StudentsResultsTable({ classDocumentId, students }: StudentsResultsTableProps) {
  const t = useTranslations('Teacher.results.students');

  return (
    <Table data-slot="students-results-table" className="min-w-3xl">
      <TableCaption className="sr-only">{t('caption')}</TableCaption>
      <TableHeader>
        <TableRow className="border-border">
          <TableHead scope="col" rowSpan={2} className="px-3 text-meta text-muted-foreground">
            {t('student')}
          </TableHead>
          <TableHead
            scope="colgroup"
            colSpan={3}
            className={cn(
              STUDENTS_TABLE_GROUP_EDGE_CLASS,
              'px-3 text-body-sm font-semibold text-foreground',
            )}
          >
            {t('testA')}
          </TableHead>
          <TableHead
            scope="colgroup"
            colSpan={3}
            className={cn(
              STUDENTS_TABLE_GROUP_EDGE_CLASS,
              'px-3 text-body-sm font-semibold text-foreground',
            )}
          >
            {t('testB')}
          </TableHead>
        </TableRow>
        <TableRow className="border-border">
          <StudentTestHeadCells variant="A" />
          <StudentTestHeadCells variant="B" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <StudentResultsRow
            key={student.student_document_id}
            classDocumentId={classDocumentId}
            student={student}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export { StudentsResultsTable };
