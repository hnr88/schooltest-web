import type {
  ClassStudentRow,
  StudentTestCell,
} from '@/modules/teacher/types/teacher-result.types';
import type { TestVariant } from '@/modules/teacher/types/teacher.types';

/** The Students tab renders C-TR-1's `students` array — it issues no second read. */
export interface StudentsTabPanelProps {
  classDocumentId: string;
  students: ClassStudentRow[];
}

export interface StudentsResultsTableProps {
  classDocumentId: string;
  students: ClassStudentRow[];
}

export interface StudentResultsRowProps {
  classDocumentId: string;
  student: ClassStudentRow;
}

/**
 * The three cells of ONE test group: Status, Score, ACARA. `variant` is used for
 * the data attribute and the group's own label — never to pick which numbers to
 * show, which the caller has already resolved from the wire object.
 */
export interface StudentTestCellsProps {
  variant: TestVariant;
  cell: StudentTestCell;
}
