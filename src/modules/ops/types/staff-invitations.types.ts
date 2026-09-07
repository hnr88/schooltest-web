import type { StaffInvitationRow, StaffInvitationsQuery } from '@schooltest/ops-contracts';

export interface OpsStaffInvitationDialogProps {
  schoolDocumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface OpsStaffInvitationTableProps {
  rows: readonly StaffInvitationRow[];
  /** One read instant for the whole table, so two rows cannot age apart. */
  nowMs: number;
}

export interface OpsStaffInvitationFiltersProps {
  role: string;
  status: string;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export interface StaffInvitationsFilterState {
  params: StaffInvitationsQuery;
  role: string;
  status: string;
  page: number;
  isFiltered: boolean;
  chooseRole: (value: string) => void;
  chooseStatus: (value: string) => void;
  goToPage: (page: number) => void;
}
