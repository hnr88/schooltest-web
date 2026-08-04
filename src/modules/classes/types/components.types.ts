import type { ClassFormTarget } from '@/modules/classes/types/hooks.types';
import type { ClassChildOption, SchoolClass } from '@/modules/classes/types/classes.types';
import type { SchoolChild } from '@/modules/school-children';
import type { SchoolTeacher } from '@/modules/teachers';

export interface ClassAssignmentPanelProps {
  schoolClass: SchoolClass;
  members: SchoolChild[];
  teachers: SchoolTeacher[];
  activeChildren: SchoolChild[];
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

export interface ClassesTableProps {
  rows: SchoolClass[];
  onEdit: (schoolClass: SchoolClass) => void;
}

export interface ClassFormDialogProps {
  target: ClassFormTarget;
  onClose: () => void;
}

export interface ClassFormProps {
  target: ClassFormTarget;
  teachers: SchoolTeacher[];
  childOptions: ClassChildOption[];
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
  students: SchoolChild[];
  value: string[];
  onChange: (next: string[]) => void;
}

export interface ClassTeacherPickerProps {
  teachers: SchoolTeacher[];
  value: string[];
  onChange: (next: string[]) => void;
}
