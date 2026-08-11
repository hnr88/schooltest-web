'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { TableHead } from '@/modules/design-system';
import { STUDENTS_TABLE_GROUP_EDGE_CLASS } from '@/modules/teacher/constants/students-table.constants';
import type { TestVariant } from '@/modules/teacher/types/teacher.types';

// The second level of the two-level header: Status · Score · ACARA under one test
// group. `scope="col"` on these, `scope="colgroup"` on the Test A / Test B cell
// above them — so a screen reader announces "Test A, Status" rather than three
// unlabelled repeats of the same three words.
function StudentTestHeadCells({ variant }: { variant: TestVariant }) {
  const t = useTranslations('Teacher.results.students');

  return (
    <>
      <TableHead
        scope="col"
        data-variant={variant}
        className={cn(STUDENTS_TABLE_GROUP_EDGE_CLASS, 'px-3 text-meta text-muted-foreground')}
      >
        {t('status')}
      </TableHead>
      <TableHead
        scope="col"
        data-variant={variant}
        className="px-3 text-meta text-muted-foreground"
      >
        {t('score')}
      </TableHead>
      <TableHead
        scope="col"
        data-variant={variant}
        className="px-3 text-meta text-muted-foreground"
      >
        {t('acara')}
      </TableHead>
    </>
  );
}

export { StudentTestHeadCells };
