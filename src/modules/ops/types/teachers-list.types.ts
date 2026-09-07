import type {
  TeacherPortalRow,
  TeachersListPagination,
  TeacherRoleFilter,
} from '@schooltest/ops-contracts';

import type { OpsTeachersTableRowProps } from '@/modules/ops/types/components.types';

/**
 * C-OPS-PORTAL-021 (OPS-031) web types. The row and pagination shapes are the
 * shared contract's own `z.infer` types — never a second hand-written copy — so
 * a server-side change to the projection breaks this build instead of silently
 * rendering a missing column.
 */

/** "no filter" sentinel for the chip groups; never sent to the API. */
export const OPS_TEACHERS_FILTER_ALL = 'all' as const;

export type OpsTeachersRoleFilter = TeacherRoleFilter | typeof OPS_TEACHERS_FILTER_ALL;
export type OpsTeachersStatusFilter = 'active' | 'suspended' | typeof OPS_TEACHERS_FILTER_ALL;

/** The directory's UI state, mapped to the wire query by the query hook. */
export interface OpsTeachersDirectoryState {
  page: number;
  q: string;
  role: OpsTeachersRoleFilter;
  status: OpsTeachersStatusFilter;
}

export interface OpsTeachersListResult {
  data: TeacherPortalRow[];
  meta: { pagination: TeachersListPagination };
}

/** The row component reads the versioned row; every legacy prop is unchanged. */
export type OpsPortalTeacherRowProps = Omit<OpsTeachersTableRowProps, 'row'> & {
  row: TeacherPortalRow;
};

export interface OpsTeachersFiltersProps {
  q: string;
  role: OpsTeachersRoleFilter;
  status: OpsTeachersStatusFilter;
  onQChange: (next: string) => void;
  onRoleChange: (next: OpsTeachersRoleFilter) => void;
  onStatusChange: (next: OpsTeachersStatusFilter) => void;
}

export interface OpsTeachersTableProps {
  rows: TeacherPortalRow[];
  pagination: TeachersListPagination;
  filtered: boolean;
  onPageChange: (next: number) => void;
  renderRow: (row: TeacherPortalRow) => React.ReactNode;
}
