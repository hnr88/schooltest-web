import type { RosterRow } from '@/modules/results';
import type { StudentsTabRow, StudentsTabView } from '@/modules/teacher/types/v2-class-tabs.types';

/**
 * The Students tab (Teacher Portal v2, `:663–721`) renders the ONE roster read
 * the class detail already made: every student of the class, `result: null`
 * where no official Result exists.
 */
export interface StudentsTabPanelProps {
  classDocumentId: string;
  rows: RosterRow[];
}

/** The sticky-header table over the rows `studentsTabRows()` returned for the current search and sort. */
export interface StudentsResultsTableProps {
  classDocumentId: string;
  view: StudentsTabView;
}

/** One data cell of a student row (Student · Growth · ACARA phase). */
export interface RosterStudentCellsProps {
  row: StudentsTabRow;
}

export type StudentsColumn = 'student' | 'score' | 'growth' | 'weakest' | 'phase' | 'export';

/** The row exports: PDF prints the student's reading report, LLM saves the server's de-identified Markdown. */
export interface StudentExportsApi {
  downloadPdf: (row: StudentsTabRow) => void;
  downloadLlm: (row: StudentsTabRow) => void;
  pdfPendingId: string | null;
  llmPendingId: string | null;
}
