import type {
  AustralianState,
  SchoolsListSort,
  Sector,
} from '@schooltest/ops-contracts';

import type {
  SchoolAccountStatus,
  SchoolOnboardingStatus,
} from '@/modules/school-admin';
import {
  SCHOOL_ACCOUNT_STATUSES,
  SCHOOL_ONBOARDING_STATUSES,
} from '@/modules/school-admin/constants/school-admin.constants';
import type { OpsSchool } from '@/modules/ops/types/ops.types';

// ⚠️ FLAG — spec vs schema reconciliation (SPEC-schools-search-filter.md §2):
// the spec's Account Status filter offers only Prospect/Invited/Active, but
// api::school.account_status is a SIX-value enum (prospect, invited, invoiced,
// active, suspended, closed) and onboarding_status a FIVE-value enum
// (not_started, link_sent, in_progress, submitted, complete). honouring the
// spec's three options verbatim would make invoiced/suspended/closed and
// in_progress/submitted schools UNREACHABLE by filter — a silent data hole.
// Decision (louder, never silent): both filters expose EVERY enum value,
// labelled with the same translations the table chips already use, plus "All".
// Flagged to the orchestrator on schooltest-mission-2026-08-18; if the client
// insists on the spec's shorter list, the missing values must fold into named
// buckets here — not disappear.
export const OPS_SCHOOLS_FILTER_ALL = 'all';

const SCHOOLS_SORTS: readonly SchoolsListSort[] = ['name:asc', 'student_count:desc', 'createdAt:desc'];
const SCHOOLS_STATES: readonly AustralianState[] = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'];
const SCHOOLS_SECTORS: readonly Sector[] = ['government', 'non-government', 'catholic'];

/** Every sort the versioned directory serves (GAP-15: last_active withheld). */
export const SCHOOLS_SORT_OPTIONS = SCHOOLS_SORTS;
export const SCHOOLS_STATE_OPTIONS = SCHOOLS_STATES;
export const SCHOOLS_SECTOR_OPTIONS = SCHOOLS_SECTORS;

export interface SchoolsFilterState {
  query: string;
  accountStatus: SchoolAccountStatus | typeof OPS_SCHOOLS_FILTER_ALL;
  onboardingStatus: SchoolOnboardingStatus | typeof OPS_SCHOOLS_FILTER_ALL;
  /** C-OPS-PORTAL-001 filters — server-applied, URL-synced, fail-open to All. */
  state: AustralianState | typeof OPS_SCHOOLS_FILTER_ALL;
  sector: Sector | typeof OPS_SCHOOLS_FILTER_ALL;
  sort: SchoolsListSort;
  page: number;
}

export const DEFAULT_SCHOOLS_FILTER: SchoolsFilterState = {
  query: '',
  accountStatus: OPS_SCHOOLS_FILTER_ALL,
  onboardingStatus: OPS_SCHOOLS_FILTER_ALL,
  state: OPS_SCHOOLS_FILTER_ALL,
  sector: OPS_SCHOOLS_FILTER_ALL,
  sort: 'name:asc',
  page: 1,
};

// URL params: ?q=abbott&status=invited&onboarding=link_sent&state=VIC&sector=catholic&sort=student_count:desc&page=2
export const SCHOOLS_FILTER_PARAMS = {
  query: 'q',
  accountStatus: 'status',
  onboardingStatus: 'onboarding',
  state: 'state',
  sector: 'sector',
  sort: 'sort',
  page: 'page',
} as const;

function oneOf<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

// Fail-open: an unknown/garbage param value degrades to "All", never to a
// filter that hides every row.
export function parseSchoolsFilter(
  params: URLSearchParams,
): SchoolsFilterState {
  const rawPage = Number(params.get(SCHOOLS_FILTER_PARAMS.page));
  return {
    query: (params.get(SCHOOLS_FILTER_PARAMS.query) ?? '').trim(),
    accountStatus: oneOf(
      params.get(SCHOOLS_FILTER_PARAMS.accountStatus),
      [OPS_SCHOOLS_FILTER_ALL, ...SCHOOL_ACCOUNT_STATUSES],
      OPS_SCHOOLS_FILTER_ALL,
    ),
    onboardingStatus: oneOf(
      params.get(SCHOOLS_FILTER_PARAMS.onboardingStatus),
      [OPS_SCHOOLS_FILTER_ALL, ...SCHOOL_ONBOARDING_STATUSES],
      OPS_SCHOOLS_FILTER_ALL,
    ),
    state: oneOf(
      params.get(SCHOOLS_FILTER_PARAMS.state),
      [OPS_SCHOOLS_FILTER_ALL, ...SCHOOLS_STATES],
      OPS_SCHOOLS_FILTER_ALL,
    ),
    sector: oneOf(
      params.get(SCHOOLS_FILTER_PARAMS.sector),
      [OPS_SCHOOLS_FILTER_ALL, ...SCHOOLS_SECTORS],
      OPS_SCHOOLS_FILTER_ALL,
    ),
    sort: oneOf(params.get(SCHOOLS_FILTER_PARAMS.sort), SCHOOLS_SORTS, DEFAULT_SCHOOLS_FILTER.sort),
    page: Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

export function serializeSchoolsFilter(
  filter: SchoolsFilterState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.query) params.set(SCHOOLS_FILTER_PARAMS.query, filter.query);
  if (filter.accountStatus !== OPS_SCHOOLS_FILTER_ALL) {
    params.set(SCHOOLS_FILTER_PARAMS.accountStatus, filter.accountStatus);
  }
  if (filter.onboardingStatus !== OPS_SCHOOLS_FILTER_ALL) {
    params.set(SCHOOLS_FILTER_PARAMS.onboardingStatus, filter.onboardingStatus);
  }
  if (filter.state !== OPS_SCHOOLS_FILTER_ALL) {
    params.set(SCHOOLS_FILTER_PARAMS.state, filter.state);
  }
  if (filter.sector !== OPS_SCHOOLS_FILTER_ALL) {
    params.set(SCHOOLS_FILTER_PARAMS.sector, filter.sector);
  }
  if (filter.sort !== DEFAULT_SCHOOLS_FILTER.sort) {
    params.set(SCHOOLS_FILTER_PARAMS.sort, filter.sort);
  }
  if (filter.page > 1) params.set(SCHOOLS_FILTER_PARAMS.page, String(filter.page));
  return params;
}

export function isDefaultSchoolsFilter(filter: SchoolsFilterState): boolean {
  return (
    filter.query === DEFAULT_SCHOOLS_FILTER.query &&
    filter.accountStatus === DEFAULT_SCHOOLS_FILTER.accountStatus &&
    filter.onboardingStatus === DEFAULT_SCHOOLS_FILTER.onboardingStatus &&
    filter.state === DEFAULT_SCHOOLS_FILTER.state &&
    filter.sector === DEFAULT_SCHOOLS_FILTER.sector &&
    filter.sort === DEFAULT_SCHOOLS_FILTER.sort &&
    filter.page === DEFAULT_SCHOOLS_FILTER.page
  );
}

// Spec §2 "Combined behaviour": search AND both filters — a school must match
// the (case-insensitive, substring) name query AND each active filter. Filters
// compose independently; clearing one never disturbs the others.
// The versioned table filters server-side (OPS-011); this in-memory pass
// remains for the legacy C-OPS-01 consumers.
export function filterOpsSchools(
  schools: readonly OpsSchool[],
  filter: SchoolsFilterState,
): OpsSchool[] {
  const needle = filter.query.toLowerCase();
  return schools.filter((school) => {
    if (!school.name.toLowerCase().includes(needle)) return false;
    if (
      filter.accountStatus !== OPS_SCHOOLS_FILTER_ALL &&
      school.account_status !== filter.accountStatus
    ) {
      return false;
    }
    if (
      filter.onboardingStatus !== OPS_SCHOOLS_FILTER_ALL &&
      school.onboarding_status !== filter.onboardingStatus
    ) {
      return false;
    }
    return true;
  });
}
