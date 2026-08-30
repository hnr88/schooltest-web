'use client';

import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { TableHead, TableRow } from '@/modules/design-system';
import { StudentTestCells } from '@/modules/teacher/components/StudentTestCells';
import { STUDENTS_TABLE_ROW_CLASS } from '@/modules/teacher/constants/students-table.constants';
import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import type { StudentResultsRowProps } from '@/modules/teacher/types/students-table.types';

// One student of C-TR-1's `students` array. The row's first cell is a real
// `<th scope="row">` (so every value below is announced with its student AND its
// column), and inside it sits ONE real <Link> — never a <div onClick>: it is
// tab-reachable, Enter-activatable and shows a focus ring.
//
// Chromium does not consistently use a positioned `<tr>` as the containing block
// for a descendant pseudo-element, so the row also forwards non-interactive-cell
// pointer clicks to the same href. The real link remains the sole keyboard target.
function StudentResultsRow({ classDocumentId, student }: StudentResultsRowProps) {
  const t = useTranslations('Teacher.results.students');
  const router = useRouter();
  const href = studentResultsHref(classDocumentId, student.student_document_id);

  return (
    <TableRow
      data-slot="student-results-row"
      data-student-id={student.student_document_id}
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
          aria-label={t('openStudent', { name: student.display_name })}
          className="rounded-sm after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {student.display_name}
        </Link>
      </TableHead>

      <StudentTestCells variant="A" cell={student.test_a} />
      <StudentTestCells variant="B" cell={student.test_b} />
    </TableRow>
  );
}

export { StudentResultsRow };
