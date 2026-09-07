/**
 * OPS-012 contract bridge — the ONE place the web app names the shared
 * C-OPS-PORTAL-002 module, so the detail row shape is never re-declared here.
 *
 * The definitions live in `mvp/contracts/ops/src/school-detail.ts` and reach
 * both applications through the BUILT `@schooltest/ops-contracts` package —
 * never through a relative path into the contracts source, which typechecks
 * but does NOT bundle (Turbopack refuses a module outside the project root).
 *
 * Only the school-detail-specific symbols are re-exported. The shared enums
 * (australianStateSchema, sectorSchema, schoolPlanSchema, schoolTypeSchema)
 * are canonically owned by `./school-create` in the package barrel; importing
 * them through this file too would give the same values a second name, which
 * is the contract drift the ops rules forbid.
 */
export {
  SchoolDetailOperation,
  SCHOOL_DETAIL_GAPS,
  schoolDetailPath,
  schoolDetailResponseSchema,
  schoolDetailSchema,
} from '@schooltest/ops-contracts';
export type {
  SchoolDetail,
  SchoolDetailGap,
  SchoolDetailResponse,
} from '@schooltest/ops-contracts';
