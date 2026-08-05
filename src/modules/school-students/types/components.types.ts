import type { SchoolClass } from '@/modules/classes';
import type { StudentFormTarget } from '@/modules/school-students/types/hooks.types';
import type { SchoolStudentFormValues } from '@/modules/school-students/schemas/school-student.schema';
import type { SchoolStudent, SchoolStudentLevelFilter, SchoolStudentRecord, SchoolStudentsPagination } from '@/modules/school-students/types/school-students.types';
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

export interface StudentsFilterBarProps {
  search: string;
  classId: string;
  level: SchoolStudentLevelFilter;
  classes: SchoolClass[];
  onSearch: (value: string) => void;
  onClass: (value: string) => void;
  onLevel: (value: SchoolStudentLevelFilter) => void;
}

export interface StudentsPaginationProps {
  pagination: SchoolStudentsPagination;
  onPage: (page: number) => void;
}

export interface StudentsTableProps {
  rows: SchoolStudent[];
  filtered: boolean;
  onEdit: (student: SchoolStudent) => void;
}

export interface StudentsTableRowProps {
  student: SchoolStudent;
  onEdit: () => void;
}

export interface SchoolStudentDetailScreenProps {
  documentId: string;
}

export interface StudentRecordPanelProps {
  student: SchoolStudentRecord;
}

export interface StudentLevelBadgeProps {
  phase: string | null;
}

export interface StudentRowActionsProps {
  student: SchoolStudent;
  onEdit: () => void;
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
}
