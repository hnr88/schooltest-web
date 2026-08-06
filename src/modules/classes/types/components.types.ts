import type { ClassFormTarget } from '@/modules/classes/types/hooks.types';
import type {
  ClassDetail,
  ClassDetailStudent,
  ClassDetailSummary,
  ClassStudentDetail,
  StudentTestResult,
  SubskillKey,
  SubskillVerdict,
} from '@/modules/classes/types/class-detail.types';
import type {
  ClassStudentOption,
  ClassTestCompletion,
  ClassTestCompletionDisplay,
  SchoolClass,
} from '@/modules/classes/types/classes.types';
import type { SchoolTeacher } from '@/modules/teachers';

export interface AddClassDialogProps {
  onClose: () => void;
}

export interface AddClassFormProps {
  teachers: SchoolTeacher[];
  onClose: () => void;
}

export interface ClassDeleteDialogProps {
  schoolClass: SchoolClass;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}

export interface ClassDetailScreenProps {
  documentId: string;
}

// `completions` is the C-RPT-04 Test A / Test B submitted counts per class
// documentId, or null when participation could not be read (the column then
// shows the empty value).
export interface ClassesTableProps {
  rows: SchoolClass[];
  completions: Map<string, ClassTestCompletion> | null;
  onEdit: (schoolClass: SchoolClass) => void;
}

export interface ClassesTableRowProps {
  row: SchoolClass;
  testsCompleted: ClassTestCompletionDisplay | null;
  onEdit: () => void;
}

export interface ClassFormDialogProps {
  target: ClassFormTarget;
  onClose: () => void;
}

export interface ClassFormProps {
  target: ClassFormTarget;
  teachers: SchoolTeacher[];
  studentOptions: ClassStudentOption[];
  onClose: () => void;
}

export interface ClassMemberOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ClassMemberChecklistProps {
  idPrefix: string;
  options: ClassMemberOption[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyText: string;
}

export interface ClassRowActionsProps {
  schoolClass: SchoolClass;
  onEdit: () => void;
}

// --- Class detail (spec §1) and student drill-down (spec §2) ---

export interface ClassDetailHeaderProps {
  schoolClass: ClassDetail;
  onEdit: () => void;
  onImport: () => void;
}

export interface ClassSummaryCardsProps {
  summary: ClassDetailSummary;
}

export interface ClassStudentsTableProps {
  classDocumentId: string;
  students: ClassDetailStudent[];
}

export interface ClassStudentsTableRowProps {
  classDocumentId: string;
  student: ClassDetailStudent;
}

export interface ClassStudentsEmptyProps {
  onImport: () => void;
}

export interface EditClassDialogProps {
  schoolClass: ClassDetail;
  onClose: () => void;
}

export interface ClassImportStudentsDialogProps {
  classDocumentId: string;
  className: string;
  onClose: () => void;
}

export interface ClassStudentDetailScreenProps {
  classDocumentId: string;
  studentDocumentId: string;
}

export interface StudentTestCardProps {
  test: StudentTestResult;
}

export interface SubskillTileProps {
  subskill: SubskillKey;
  verdict: SubskillVerdict;
}

export interface StudentDetailSubtitleProps {
  student: ClassStudentDetail;
}
