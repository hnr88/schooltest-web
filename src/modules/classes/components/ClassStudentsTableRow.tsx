'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { StatusPill, TableCell, TableRow } from '@/modules/design-system';
import {
  EMPTY_VALUE,
  scoreLabel,
  studentDisplayName,
  testFor,
} from '@/modules/classes/lib/class-detail.helpers';
import { TEST_SLOTS } from '@/modules/classes/constants/subskills.constants';

import type { ClassStudentsTableRowProps } from '@/modules/classes/types/components.types';
import type { StudentTestResult } from '@/modules/classes/types/class-detail.types';

// One spec §1 roster row. The ACARA cell prints the backend's phase LABEL
// verbatim — the frontend never maps a score to a phase and never renders
// "Phase N". Every student name links to the drill-down, including rows where
// neither test is started — the detail screen renders those gracefully (a muted
// "not completed" line per slot), and C-CLS-06 serves any class member.
export function ClassStudentsTableRow({ classDocumentId, student }: ClassStudentsTableRowProps) {
  const t = useTranslations('Classes.detail.table');
  const name = studentDisplayName(student);

  const statusCell = (test: StudentTestResult | null) => {
    if (test === null || test.status === 'not_started') {
      return <span className="text-sm text-muted-foreground">{t('statusNotStarted')}</span>;
    }
    if (test.status === 'in_progress') {
      return <StatusPill tone="warning">{t('statusInProgress')}</StatusPill>;
    }
    return <StatusPill tone="success">{t('statusDone')}</StatusPill>;
  };

  return (
    <TableRow className="group relative">
      <TableCell className="font-semibold">
        <Link
          href={`/dashboard/school/classes/${classDocumentId}/students/${student.documentId}`}
          className="cursor-pointer rounded-sm text-left font-semibold text-foreground underline-offset-4 transition-colors duration-150 group-hover:text-primary group-hover:underline after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {name}
        </Link>
      </TableCell>
      {TEST_SLOTS.map((slot) => {
        const test = testFor(student.tests, slot);
        return [
          <TableCell key={`${slot}-status`} className="text-center">
            {statusCell(test)}
          </TableCell>,
          <TableCell key={`${slot}-score`} className="text-center font-semibold">
            {scoreLabel(test)}
          </TableCell>,
          <TableCell key={`${slot}-acara`} className="text-center text-sm">
            {test?.acara_phase ?? EMPTY_VALUE}
          </TableCell>,
        ];
      })}
    </TableRow>
  );
}
