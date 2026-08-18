'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // Last query string this hook wrote (null before mount). Guards the
  // debounced-search effect against replace loops: after router.replace the
  // searchParams identity changes and the effect re-fires, but the serialized
  // state then equals lastWritten and the write is skipped.
  const lastWritten = useRef<string | null>(null);

  const writeUrl = useCallback(
    (next: SchoolsFilterState) => {
      const qs = serializeSchoolsFilter(next).toString();
      lastWritten.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const filter: SchoolsFilterState = useMemo(
    () => ({ ...urlFilter, query: debouncedInput.trim() }),
    [urlFilter, debouncedInput],
  );

  // Spec §1/§3: once the debounced search settles, the query lands in the URL
  // alongside any active filters. On mount the URL is adopted as-is (the input
  // was initialised from it), not rewritten.
  useEffect(() => {
    const next: SchoolsFilterState = {
      ...parseSchoolsFilter(searchParams),
      query: debouncedInput.trim(),
    };
    const qs = serializeSchoolsFilter(next).toString();
    if (lastWritten.current === null) {
      lastWritten.current = qs;
      return;
    }
    if (qs === lastWritten.current) return;
    writeUrl(next);
    // Fire only when the settled search changes; searchParams/writeUrl are
    // read fresh but deliberately not listed — the lastWritten guard makes
    // re-runs no-ops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

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
