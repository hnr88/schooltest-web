'use client';

import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { TableHead, TableRow } from '@/modules/design-system';
import { RosterStudentCells } from '@/modules/teacher/components/RosterStudentCells';
import { STUDENTS_TABLE_ROW_CLASS } from '@/modules/teacher/constants/students-table.constants';
import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import type { StudentResultsRowProps } from '@/modules/teacher/types/students-table.types';

// One roster row (task 33). The row's first cell is a real `<th scope="row">`
// (so every value below is announced with its student AND its column), and
// inside it sits ONE real <Link> — never a <div onClick>: it is tab-reachable,
// Enter-activatable and shows a focus ring.
//
// Chromium does not consistently use a positioned `<tr>` as the containing block
// for a descendant pseudo-element, so the row also forwards non-interactive-cell
// pointer clicks to the same href. The real link remains the sole keyboard target.
function StudentResultsRow({ classDocumentId, row }: StudentResultsRowProps) {
  const t = useTranslations('Teacher.results.students');
  const router = useRouter();
  const href = studentResultsHref(classDocumentId, row.student.document_id);

  return (
    <TableRow
      data-slot="student-results-row"
      data-student-id={row.student.document_id}
      data-scored={row.result !== null}
      className={`${STUDENTS_TABLE_ROW_CLASS} cursor-pointer`}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a, button')) return;
        router.push(href);
      }}
    >
      <TableHead
        scope="row"
        className="h-auto px-3 py-3 text-body-sm font-semibold text-foreground"
      >
        <Link
          href={href}
          aria-label={t('openStudent', { name: row.student.name })}
          className="rounded-sm after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {row.student.name}
        </Link>
      </TableHead>

      <RosterStudentCells row={row} />
    </TableRow>
  );
}

export { StudentResultsRow };
