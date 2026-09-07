import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * Task 33 — the Students tab renders the ROSTER read (task 23 wrapper): every
 * student of the class, `result: null` where no official Result exists. The v1
 * C-TR-1 `students` array and its Test A/B cells are gone.
 */
export interface StudentsTabPanelProps {
  classDocumentId: string;
  rows: RosterRow[];
}

export interface StudentsResultsTableProps {
  classDocumentId: string;
  rows: RosterRow[];
}

export interface StudentResultsRowProps {
  classDocumentId: string;
  row: RosterRow;
}

/** The single-level column headers of the roster table (no props — one group). */
export interface RosterHeadCellsProps {}

/** The five data cells of one roster row: Score · Growth · Weakest skill · ACARA · Confidence. */
export interface RosterStudentCellsProps {
  row: RosterRow;
}
