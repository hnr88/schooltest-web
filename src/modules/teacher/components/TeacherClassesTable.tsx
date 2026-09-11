'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { TeacherClassRow } from '@/modules/teacher/components/TeacherClassRow';
import {
  CLASSES_TABLE_COLS,
  CLASSES_TH,
  SOON_COLUMNS,
} from '@/modules/teacher/constants/classes-screen.constants';
import type { TeacherClassesTableProps } from '@/modules/teacher/types/classes-screen.types';

/**
 * The Classes list body (`Teacher Portal v2.dc.html:167–212`): a real table in
 * a 560px scroller with the sticky hairline header — CLASS · READING (navy) ·
 * LISTENING · WRITING · SPEAKING · STATUS · EXPORT. The header stays when a
 * search matches nothing, and the design's line sits under it.
 */
function TeacherClassesTable({ rows, exports, empty }: TeacherClassesTableProps) {
  const t = useTranslations('TeacherPortal.classes');

  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className={cn(CLASSES_TH, 'pl-8')}>
              {t('columns.class')}
            </th>
            <th scope="col" className={cn(CLASSES_TH, CLASSES_TABLE_COLS.reading, 'text-navy-900')}>
              {t('columns.reading')}
            </th>
            {SOON_COLUMNS.map((column) => (
              <th key={column} scope="col" className={cn(CLASSES_TH, CLASSES_TABLE_COLS[column])}>
                {t(`columns.${column}`)}
              </th>
            ))}
            <th scope="col" className={cn(CLASSES_TH, CLASSES_TABLE_COLS.status)}>
              {t('columns.status')}
            </th>
            <th scope="col" className={cn(CLASSES_TH, CLASSES_TABLE_COLS.export, 'pr-8 text-right')}>
              {t('columns.export')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => <TeacherClassRow key={row.id} row={row} exports={exports} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

export { TeacherClassesTable };
