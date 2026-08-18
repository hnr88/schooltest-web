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

export interface SchoolsFilterState {
  query: string;
  accountStatus: SchoolAccountStatus | typeof OPS_SCHOOLS_FILTER_ALL;
  onboardingStatus: SchoolOnboardingStatus | typeof OPS_SCHOOLS_FILTER_ALL;
}

export const DEFAULT_SCHOOLS_FILTER: SchoolsFilterState = {
  query: '',
  accountStatus: OPS_SCHOOLS_FILTER_ALL,
  onboardingStatus: OPS_SCHOOLS_FILTER_ALL,
};

// URL params (spec §3): ?q=abbott&status=invited&onboarding=link_sent
export const SCHOOLS_FILTER_PARAMS = {
  query: 'q',
  accountStatus: 'status',
  onboardingStatus: 'onboarding',
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
  return params;
}

export function isDefaultSchoolsFilter(filter: SchoolsFilterState): boolean {
  return (
    filter.query === DEFAULT_SCHOOLS_FILTER.query &&
    filter.accountStatus === DEFAULT_SCHOOLS_FILTER.accountStatus &&
    filter.onboardingStatus === DEFAULT_SCHOOLS_FILTER.onboardingStatus
  );
}

// Spec §2 "Combined behaviour": search AND both filters — a school must match
// the (case-insensitive, substring) name query AND each active filter. Filters
// compose independently; clearing one never disturbs the others.
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
