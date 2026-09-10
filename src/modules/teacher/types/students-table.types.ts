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

/** ops/34 — the roster table is the kit's `client`-mode table; rows arrive in the loaded (attention) order. */
export interface StudentsResultsTableProps {
  classDocumentId: string;
  rows: RosterRow[];
}

/** One roster data cell of the kit's table (Score · Growth · Weakest skill · ACARA · Confidence). */
export interface RosterStudentCellsProps {
  row: RosterRow;
}
