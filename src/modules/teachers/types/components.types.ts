import type { SchoolStaffRole, StaffRow } from '@/modules/teachers/types/teachers.types';

// An extra consequence the plain description cannot state, shown only when the
// data says it applies (spec section 3's "may affect reporting").
export interface StaffActionWarning {
  title: string;
  body: string;
}

export interface ConfirmStaffActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  warning?: StaffActionWarning;
  cancelLabel: string;
  confirmLabel: string;
  destructive: boolean;
  pending: boolean;
  onConfirm: () => void;
}

export interface InviteTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Which staff role the invitation creates. Defaults to `teacher` — the
  // Teachers screen adds teachers — so the form keeps the spec's three fields
  // while the school_admin invitation stays reachable.
  role?: SchoolStaffRole;
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
