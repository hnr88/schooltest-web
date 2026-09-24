import type { DirectoryQueryStatus } from '@/modules/directory';

import type {
  ClassDetail,
  ClassDetailStudent,
  ClassDetailSummary,
  ClassDetailTeacher,
  ClassStudentDetail,
  StudentTestResult,
  SubskillKey,
  SubskillVerdict,
} from '@/modules/classes/types/class-detail.types';
import type {
  ClassPendingTeacher,
  ClassTestCompletion,
  ClassTestCompletionDisplay,
  SchoolClass,
} from '@/modules/classes/types/classes.types';
import type { SchoolStudent } from '@/modules/school-students';
import type { SchoolInvitation, SchoolTeacher } from '@/modules/teachers';

export interface AddClassDialogProps {
  onClose: () => void;
}

export interface AddClassFormProps {
  teachers: SchoolTeacher[];
  // BUG-006: invited teachers still pending activation — assignable too.
  invitations: SchoolInvitation[];
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

/** The table's own props: the screen's contract plus the kit's query slot. */
export interface ClassesTableKitProps extends ClassesTableProps {
  /** The consumer's query status; the kit's loading/error/stale arms read it. */
  query?: DirectoryQueryStatus;
}

export interface ClassesTableRowProps {
  row: SchoolClass;
  testsCompleted: ClassTestCompletionDisplay | null;
  onEdit: () => void;
}

// Spec §1 Edit Class modal target: the minimal shape both entry points can
// supply — the class-detail screen passes its full C-CLS-05 payload, the
// classes list passes its roster row with the single assigned teacher.
export interface EditClassTarget {
  documentId: string;
  name: string | null;
  teacher?: { documentId: string } | null;
  // BUG-006: known only where the read carries it (the classes list); absent
  // means unknown, and the edit then never touches the pending teacher.
  pending_teacher?: ClassPendingTeacher | null;
}

export interface EditClassDialogProps {
  schoolClass: EditClassTarget;
  onClose: () => void;
}

export interface ClassMemberOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ClassRowActionsProps {
  schoolClass: SchoolClass;
  onEdit: () => void;
}

// --- Class detail (spec §1) and student drill-down (spec §2) ---

// BUG-006: `pendingTeacher` is read from the C-CLS-01 row (C-CLS-05 stays
// strict and unchanged); undefined = not known yet.
export interface ClassDetailHeaderProps {
  schoolClass: ClassDetail;
  pendingTeacher?: ClassPendingTeacher | null;
  onEdit: () => void;
  onImport: () => void;
}

export interface ClassTeacherPanelProps {
  schoolClass: ClassDetail;
  pendingTeacher?: ClassPendingTeacher | null;
}

export interface PicksClearedNoticeProps {
  // Option values a toggle unticked (BUG-005 a11y), and how each one reads.
  dropped: readonly string[];
  labelOf: (value: string) => string;
}

export interface ClassTeachersPickerDialogProps {
  className: string;
  currentTeacher: ClassDetailTeacher | null;
  // BUG-006: invited teachers are offered only while the class has no teacher.
  allowInvited: boolean;
  pending: boolean;
  onSubmit: (teacherDocumentIds: string[]) => Promise<boolean>;
  onClose: () => void;
}

export interface ClassStudentsPickerDialogProps {
  classDocumentId: string;
  className: string;
  roster: ClassDetailStudent[];
  pending: boolean;
  onSubmit: (students: SchoolStudent[]) => Promise<boolean>;
  onClose: () => void;
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
  verdict: SubskillVerdict | null;
}

export interface StudentDetailSubtitleProps {
  student: ClassStudentDetail;
}
