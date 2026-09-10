import {
  OPS_SCHOOLS_EXPORT_FALLBACK_FILENAME,
  OPS_SCHOOLS_EXPORT_MAX_SELECTION,
  OPS_SCHOOLS_EXPORT_QUERY_MAX,
  OPS_SCHOOLS_EXPORT_SORTS,
  OPS_SCHOOL_SECTORS,
  OPS_SCHOOL_STATES,
  PORTAL_SCHOOL_PLANS,
  PORTAL_SCHOOL_STATUSES,
} from '@/modules/ops/constants/schools-export.constants';
import type {
  OpsSchoolSector,
  OpsSchoolState,
  OpsSchoolsExportScope,
  OpsSchoolsExportSort,
  PortalSchoolPlan,
  PortalSchoolStatus,
} from '@/modules/ops/types/schools-export.types';
import type { SchoolOnboardingStatus } from '@/modules/school-admin';
import { SCHOOL_ONBOARDING_STATUSES } from '@/modules/school-admin/constants/school-admin.constants';

/**
 * C-OPS-PORTAL-009 (OPS-019) — reading and serialising the export scope.
 *
 * The request shape mirrors `mvp/contracts/ops/src/schools-export.ts`; see
 * `constants/schools-export.constants.ts` for why the vocabulary is mirrored
 * rather than imported from `@schooltest/ops-contracts` today.
 */
function oneOf<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

/**
 * Read the scope from the directory's own URL, so the download is exactly the
 * list the operator is looking at. An unknown value is DROPPED rather than
 * sent: a stale or hand-typed param must not turn a download button into a 400,
 * and a dropped filter is always visible in the scope summary rendered above
 * the action.
 */
export function parseSchoolsExportScope(params: URLSearchParams): OpsSchoolsExportScope {
  const q = (params.get('q') ?? '').trim().slice(0, OPS_SCHOOLS_EXPORT_QUERY_MAX);
  const selected = params
    .getAll('documentIds')
    .map((value) => value.trim())
    .filter((value) => value !== '');
  const unique = [...new Set(selected)].slice(0, OPS_SCHOOLS_EXPORT_MAX_SELECTION);
  return {
    q: q === '' ? undefined : q,
    status: oneOf<PortalSchoolStatus>(params.get('status'), PORTAL_SCHOOL_STATUSES),
    onboarding: oneOf<SchoolOnboardingStatus>(params.get('onboarding'), SCHOOL_ONBOARDING_STATUSES),
    state: oneOf<OpsSchoolState>(params.get('state'), OPS_SCHOOL_STATES),
    sector: oneOf<OpsSchoolSector>(params.get('sector'), OPS_SCHOOL_SECTORS),
    plan: oneOf<PortalSchoolPlan>(params.get('plan'), PORTAL_SCHOOL_PLANS),
    sort: oneOf<OpsSchoolsExportSort>(params.get('sort'), OPS_SCHOOLS_EXPORT_SORTS),
    documentIds: unique.length === 0 ? undefined : unique,
  };
}

/** A caller-supplied selection replaces whatever the URL carried. */
export function withSelection(
  scope: OpsSchoolsExportScope,
  selected: readonly string[] | undefined,
): OpsSchoolsExportScope {
  if (selected === undefined) return scope;
  const unique = [...new Set(selected)].slice(0, OPS_SCHOOLS_EXPORT_MAX_SELECTION);
  return { ...scope, documentIds: unique.length === 0 ? undefined : unique };
}

/**
 * `documentIds=a&documentIds=b` — the repeated form the contract declares.
 * Axios' default array serializer emits `documentIds[]=a`, which the server
 * rejects, so the request always carries THIS `URLSearchParams`.
 */
export function schoolsExportSearchParams(scope: OpsSchoolsExportScope): URLSearchParams {
  const params = new URLSearchParams();
  if (scope.q !== undefined) params.append('q', scope.q);
  if (scope.status !== undefined) params.append('status', scope.status);
  if (scope.onboarding !== undefined) params.append('onboarding', scope.onboarding);
  if (scope.state !== undefined) params.append('state', scope.state);
  if (scope.sector !== undefined) params.append('sector', scope.sector);
  if (scope.plan !== undefined) params.append('plan', scope.plan);
  if (scope.sort !== undefined) params.append('sort', scope.sort);
  for (const documentId of scope.documentIds ?? []) params.append('documentIds', documentId);
  return params;
}

/** True when the scope narrows the export at all (drives the summary copy). */
export function schoolsExportHasFilters(scope: OpsSchoolsExportScope): boolean {
  return [scope.q, scope.status, scope.onboarding, scope.state, scope.sector, scope.plan].some(
    (value) => value !== undefined,
  );
}

/** Stable cache key: identical scopes share a fetch, different ones never do. */
export function schoolsExportScopeKey(scope: OpsSchoolsExportScope): string {
  return schoolsExportSearchParams(scope).toString();
}

/** `attachment; filename="schools-selected-3.csv"` → `schools-selected-3.csv`. */
export function filenameFromContentDisposition(header: string | undefined): string {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? OPS_SCHOOLS_EXPORT_FALLBACK_FILENAME;
}

/**
 * ops/09 — the row count for the bulk-Export toast. `createCsvStream`
 * (`schooltest-api/src/utils/csv.ts`) always terminates a line with `\r\n`,
 * header included, so splitting on it and dropping the header line is the
 * SERVER's own row count — never `selected.length` (D-16).
 */
export function schoolsExportRowCount(csv: string): number {
  const lines = csv.split('\r\n').filter((line) => line !== '');
  return Math.max(0, lines.length - 1);
}
