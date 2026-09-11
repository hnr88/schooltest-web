import type { SchoolClass } from '@/modules/classes';
import type { DirectoryFilterDef, DirectoryMeta, DirectoryQueryStatus, DirectoryStateApi } from '@/modules/directory';
import type { StudentFormTarget } from '@/modules/school-students/types/hooks.types';
import type { SchoolStudentFormValues } from '@/modules/school-students/schemas/school-student.schema';
import type { SchoolStudent, SchoolStudentRecord } from '@/modules/school-students/types/school-students.types';
import type { UseFormReturn } from 'react-hook-form';

export interface ArchiveStudentDialogProps {
  student: SchoolStudent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}

export interface StudentEaldFieldsProps {
  form: UseFormReturn<SchoolStudentFormValues>;
  showAcaraPhase: boolean;
}

export interface StudentsHeaderProps {
  studentCount: number;
  classCount: number;
  onImport: () => void;
}

// Task 31 — the roster table renders through the shared directory kit: the
// state, filter defs, query status and pagination meta flow straight through,
// and the dialogs the row actions open stay screen-owned.
export interface StudentsTableProps {
  state: DirectoryStateApi;
  filters: readonly DirectoryFilterDef[];
  query: DirectoryQueryStatus;
  rows: readonly SchoolStudent[];
  meta?: DirectoryMeta;
  onEdit: (student: SchoolStudent) => void;
  onArchive: (student: SchoolStudent) => void;
}

export interface SchoolStudentDetailScreenProps {
  documentId: string;
}

export interface StudentRecordPanelProps {
  student: SchoolStudentRecord;
  onEdit: () => void;
}

export interface StudentLevelBadgeProps {
  phase: string | null;
  /** Row-list sizing (5px 12px) instead of the drill-down's 6px 13px. */
  compact?: boolean;
}

export interface StudentImportDialogProps {
  classes: SchoolClass[];
  onClose: () => void;
}

export interface SchoolStudentEditDialogProps {
  student: SchoolStudent;
  classes: SchoolClass[];
  onClose: () => void;
}

export interface SchoolStudentFormProps {
  target: StudentFormTarget;
  classes: SchoolClass[];
  showAcaraPhase: boolean;
  onCancel: () => void;
  onDone: () => void;
  /** Render the modal-kit body/footer chrome (OpsDialog kit) instead of the flat page layout. */
  modal?: boolean;
}
