'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { usePathname } from '@/i18n/navigation';
import { useDebouncedValue } from '@/modules/dashboard';
import {
  DEFAULT_SCHOOLS_FILTER,
  OPS_SCHOOLS_FILTER_ALL,
  SCHOOLS_FILTER_PARAMS,
  type SchoolsFilterState,
  isDefaultSchoolsFilter,
  parseSchoolsFilter,
  serializeSchoolsFilter,
} from '@/modules/ops/lib/schools-filter.lib';
import { SCHOOL_ACCOUNT_STATUSES } from '@/modules/school-admin/constants/school-admin.constants';
import { SCHOOL_ONBOARDING_STATUSES } from '@/modules/school-admin/constants/school-admin.constants';

const ACCOUNT_STATUS_VALUES = [
  OPS_SCHOOLS_FILTER_ALL,
  ...SCHOOL_ACCOUNT_STATUSES,
] as const;
const ONBOARDING_STATUS_VALUES = [
  OPS_SCHOOLS_FILTER_ALL,
  ...SCHOOL_ONBOARDING_STATUSES,
] as const;

const SEARCH_DEBOUNCE_MS = 200;

// Spec SPEC-schools-search-filter.md: search input is instant (typing updates
// the box), the TABLE filters on a ~200ms debounce, and the full state lives
// in the URL (?q&status&onboarding) so a filtered view is shareable. The URL
// is replaced (not pushed) — filtering is not navigation history.
export function useSchoolsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFilter = useMemo(
    () => parseSchoolsFilter(searchParams),
    [searchParams],
  );

  // The input's live text; URL + table follow the debounced value.
  const [searchInput, setSearchInput] = useState(urlFilter.query);
  const debouncedInput = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const writeUrl = useCallback(
    (next: SchoolsFilterState) => {
      const qs = serializeSchoolsFilter(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const filter: SchoolsFilterState = useMemo(
    () => ({ ...urlFilter, query: debouncedInput.trim() }),
    [urlFilter, debouncedInput],
  );

  const setAccountStatus = useCallback(
    (raw: string) => {
      const accountStatus = ACCOUNT_STATUS_VALUES.includes(
        raw as SchoolsFilterState['accountStatus'],
      )
        ? (raw as SchoolsFilterState['accountStatus'])
        : OPS_SCHOOLS_FILTER_ALL;
      writeUrl({ ...urlFilter, query: debouncedInput.trim(), accountStatus });
    },
    [writeUrl, urlFilter, debouncedInput],
  );

  const setOnboardingStatus = useCallback(
    (raw: string) => {
      const onboardingStatus = ONBOARDING_STATUS_VALUES.includes(
        raw as SchoolsFilterState['onboardingStatus'],
      )
        ? (raw as SchoolsFilterState['onboardingStatus'])
        : OPS_SCHOOLS_FILTER_ALL;
      writeUrl({
        ...urlFilter,
        query: debouncedInput.trim(),
        onboardingStatus,
      });
    },
    [writeUrl, urlFilter, debouncedInput],
  );

  // Spec §5: clearing search keeps filters; clearing a filter keeps search.
  // "Clear all" is the one control that resets everything at once.
  const clearAll = useCallback(() => {
    setSearchInput('');
    writeUrl(DEFAULT_SCHOOLS_FILTER);
  }, [writeUrl]);

  return {
    filter,
    searchInput,
    setSearchInput,
    setAccountStatus,
    setOnboardingStatus,
    clearAll,
    hasActiveFilters: !isDefaultSchoolsFilter(filter),
  };
}
