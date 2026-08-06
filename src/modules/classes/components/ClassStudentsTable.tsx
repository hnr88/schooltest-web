'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { ClassStudentsTableRow } from '@/modules/classes/components/ClassStudentsTableRow';

import type { ClassStudentsTableProps } from '@/modules/classes/types/components.types';

// Spec §1 student table: Student | Test A | Score | ACARA | Test B | Score |
// ACARA. The wide grid scrolls inside its own panel, so the page body never
// scrolls horizontally at mobile widths.
//
// `table-fixed` + a quarter on the Student column is what makes the layout
// match the wireframe's proportions: the six result columns then share the
// remaining 75% EQUALLY instead of being sized by their content (which made
// "Not started" cells wider than "Score" ones). The spec's own width column
// sums to 105% and cannot be applied literally, and Tailwind's scale has no
// bracket-free 12%/10%/14% — arbitrary values are banned by rules/tailwind.md.
export function ClassStudentsTable({ classDocumentId, students }: ClassStudentsTableProps) {
  const t = useTranslations('Classes.detail.table');

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table className="min-w-3xl table-fixed">
        <caption className="sr-only">{t('caption')}</caption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-1/4">
              {t('columnStudent')}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {t('columnTestA')}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {t('columnScore')}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {t('columnAcara')}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {t('columnTestB')}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {t('columnScore')}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {t('columnAcara')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <ClassStudentsTableRow
              key={student.documentId}
              classDocumentId={classDocumentId}
              student={student}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
