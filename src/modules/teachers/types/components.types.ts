import type { StaffRow } from '@/modules/teachers/types/teachers.types';

export interface ConfirmStaffActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive: boolean;
  pending: boolean;
  onConfirm: () => void;
}

export interface InviteTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mounted only while editing, so the row's values are always the defaults.
export interface EditTeacherDialogProps {
  row: StaffRow;
  onClose: () => void;
}

export interface StaffRowActionsProps {
  row: StaffRow;
}

export interface StaffTableRowProps {
  row: StaffRow;
}

export interface TeachersTableProps {
  rows: StaffRow[];
}
