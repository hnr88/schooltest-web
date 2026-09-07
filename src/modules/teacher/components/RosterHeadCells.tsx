'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { TableHead } from '@/modules/design-system';
import { STUDENTS_TABLE_GROUP_EDGE_CLASS } from '@/modules/teacher/constants/students-table.constants';
import type { RosterHeadCellsProps } from '@/modules/teacher/types/students-table.types';

// The single-level header of the roster table (task 33): one row of six real
// `scope="col"` headers — Student · Score · Growth · Weakest skill · ACARA ·
// Confidence. The Confidence column holds the ⚠ marker; its header says the
// WORD so the glyph is never the only signal.
function RosterHeadCells(_props: RosterHeadCellsProps) {
  const t = useTranslations('Teacher.results.students');

  const cells = [
    { key: 'score', edge: true },
    { key: 'growth', edge: false },
    { key: 'weakest', edge: false },
    { key: 'acara', edge: false },
    { key: 'confidence', edge: false },
  ] as const;

  return (
    <>
      {cells.map((cell) => (
        <TableHead
          key={cell.key}
          scope="col"
          data-slot={`roster-head-${cell.key}`}
          className={cn(cell.edge && STUDENTS_TABLE_GROUP_EDGE_CLASS, 'px-3 text-meta text-muted-foreground')}
        >
          {t(cell.key)}
        </TableHead>
      ))}
    </>
  );
}

export { RosterHeadCells };
