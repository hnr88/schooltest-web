import type { ClassFormTarget } from '@/modules/classes/types/hooks.types';
import type { ClassStudentOption, SchoolClass } from '@/modules/classes/types/classes.types';
import type { SchoolStudent } from '@/modules/school-students';
import type { SchoolTeacher } from '@/modules/teachers';

export interface AddClassDialogProps {
  onClose: () => void;
}

export interface AddClassFormProps {
  teachers: SchoolTeacher[];
  onClose: () => void;
}

export interface ClassAssignmentPanelProps {
  schoolClass: SchoolClass;
  members: SchoolStudent[];
  teachers: SchoolTeacher[];
  activeStudents: SchoolStudent[];
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

// `completions` is the C-RPT-04 submitted-count per class documentId, or null
// when participation could not be read (the column then shows the empty value).
export interface ClassesTableProps {
  rows: SchoolClass[];
  completions: Map<string, number> | null;
  onEdit: (schoolClass: SchoolClass) => void;
}

export interface ClassesTableRowProps {
  row: SchoolClass;
  testsCompleted: string;
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

export interface ClassStudentPickerProps {
  students: SchoolStudent[];
  value: string[];
  onChange: (next: string[]) => void;
}

export interface ClassTeacherPickerProps {
  teachers: SchoolTeacher[];
  value: string[];
  onChange: (next: string[]) => void;
}
