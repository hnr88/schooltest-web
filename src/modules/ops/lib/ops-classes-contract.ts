/**
 * OPS-038 contract bridge — the ONE place the web app names the shared
 * C-OPS-PORTAL-028 module, so nothing here is a second declaration of the row
 * shape, the status rule or the query keys.
 *
 * The definitions live in `mvp/contracts/ops/src/classes-list.ts` and reach
 * both applications through the built `@schooltest/ops-contracts` package —
 * never through a relative path into the contracts source, which typechecks
 * but does NOT bundle (Turbopack refuses a module outside the project root:
 * "Module not found: Can't resolve '../../../../../mvp/contracts/ops/src/...'").
 */
export {
  ClassesListOperation,
  classListSortSchema,
  classListStatusSchema,
  classRowEnvelopeSchema,
  classRowSchema,
  classRowStatus,
  classSchoolRefSchema,
  classTeacherRefSchema,
  classTestWindowSchema,
  classesListPath,
  classesListPaginationSchema,
  classesListQueryParams,
  classesListQuerySchema,
  classesListRequestSchema,
  classesListResponseSchema,
} from '@schooltest/ops-contracts';
export type {
  ClassListSort,
  ClassListStatus,
  ClassRow,
  ClassSchoolRef,
  ClassTeacherRef,
  ClassTestWindow,
  ClassesListPagination,
  ClassesListQuery,
  ClassesListResponse,
} from '@schooltest/ops-contracts';
