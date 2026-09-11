import type { StudentsColumn } from '@/modules/teacher/types/students-table.types';
import type { StudentsSort } from '@/modules/teacher/types/v2-class-tabs.types';

/**
 * The Teacher Portal v2 Students tab (`Teacher Portal v2.dc.html:663–721`),
 * drawn to the design's values. No cut and no state derivation lives here —
 * the rows arrive from `studentsTabRows()`.
 */

/** The sort select, in the design's order (`:678`). */
export const STUDENTS_SORTS: readonly StudentsSort[] = ['name', 'high', 'low', 'phase'];

export const STUDENTS_COLUMNS: readonly StudentsColumn[] = [
  'student',
  'score',
  'growth',
  'weakest',
  'phase',
  'export',
];

/** Flex tracks (`:684–689`): basis and min-width per column, shared by the header and every row. */
export const STUDENTS_COLUMN: Readonly<Record<StudentsColumn, string>> = {
  student: 'flex-[3_1_170px] min-w-[150px]',
  score: 'flex-[1_1_90px] min-w-[80px]',
  growth: 'flex-[1_1_80px] min-w-[70px]',
  weakest: 'flex-[2_1_150px] min-w-[130px]',
  phase: 'flex-[1_1_120px] min-w-[110px]',
  export: 'flex-[0_0_168px] min-w-[168px]',
};

/** The max-height scroll box (`:682`): 560 content + the 1px border each side, as drawn. */
export const STUDENTS_SCROLL_CLASS =
  'max-h-[562px] overflow-y-auto rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[26px]';

/** The sticky header row (`:683`); the design's #9CA3AF label grey is drawn #6B7280 for AA contrast. */
export const STUDENTS_HEAD_CLASS =
  'sticky top-0 z-[2] flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-[#ECEEF2] bg-white pt-[18px] pb-[11px] text-[11.5px] font-semibold tracking-[0.05em] text-[#6B7280] uppercase';

/**
 * One student row (`:692`). `relative` anchors the name link stretched over a
 * scored row; `isolate` keeps the export buttons under the sticky header.
 */
export const STUDENTS_ROW_CLASS =
  'relative isolate -mx-3 flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[8px] border-b border-[#EEF1F6] px-3 py-3.5 last:border-transparent';
