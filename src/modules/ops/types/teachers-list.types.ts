import type {
  TeacherPortalRow,
  TeachersListPagination,
} from '@schooltest/ops-contracts';

/**
 * C-OPS-PORTAL-021 (OPS-031) web types. The row and pagination shapes are the
 * shared contract's own `z.infer` types — never a second hand-written copy — so
 * a server-side change to the projection breaks this build instead of silently
 * rendering a missing column.
 */

export interface OpsTeachersListResult {
  data: TeacherPortalRow[];
  meta: { pagination: TeachersListPagination };
}
