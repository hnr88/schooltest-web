import type { SchoolClass } from '@/modules/classes';
import type { ChildFormTarget } from '@/modules/school-children/types/hooks.types';
import type { SchoolChildFormValues } from '@/modules/school-children/schemas/school-child.schema';
import type { SchoolChild, SchoolChildStatusFilter, SchoolChildrenPagination } from '@/modules/school-children/types/school-children.types';
import type { UseFormReturn } from 'react-hook-form';

export interface ArchiveChildDialogProps {
  child: SchoolChild;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}

export interface ChildEaldFieldsProps {
  form: UseFormReturn<SchoolChildFormValues>;
  showAcaraPhase: boolean;
}

export interface ChildrenFilterBarProps {
  search: string;
  status: SchoolChildStatusFilter;
  classId: string;
  classes: SchoolClass[];
  onSearch: (value: string) => void;
  onStatus: (value: SchoolChildStatusFilter) => void;
  onClass: (value: string) => void;
}

export interface ChildrenPaginationProps {
  pagination: SchoolChildrenPagination;
  onPage: (page: number) => void;
}

export interface ChildrenTableProps {
  rows: SchoolChild[];
  filtered: boolean;
  onEdit: (child: SchoolChild) => void;
}

export interface ChildRowActionsProps {
  child: SchoolChild;
  onEdit: () => void;
}

export interface SchoolChildEditDialogProps {
  child: SchoolChild;
  classes: SchoolClass[];
  onClose: () => void;
}

export interface SchoolChildFormProps {
  target: ChildFormTarget;
  classes: SchoolClass[];
  showAcaraPhase: boolean;
  onCancel: () => void;
  onDone: () => void;
}
