'use client';

import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';

import { Button, SelectField } from '@/modules/design-system';
import { Input } from '@/components/ui/input';
import {
  OPS_SCHOOLS_FILTER_ALL,
} from '@/modules/ops/lib/schools-filter.lib';
import {
  SCHOOL_ACCOUNT_STATUSES,
  SCHOOL_ONBOARDING_STATUSES,
} from '@/modules/school-admin/constants/school-admin.constants';

import type { OpsSchoolsFiltersProps } from '@/modules/ops/types/components.types';

// Spec SPEC-schools-search-filter.md §1-§4: search bar + the two lifecycle
// filters between the page subtitle and the table, with the live
// "Showing X of Y schools" count. The option lists intentionally carry every
// enum value — see the ⚠️ FLAG in schools-filter.lib.ts.
export function OpsSchoolsFilters({
  searchInput,
  onSearchInputChange,
  accountStatus,
  onAccountStatusChange,
  onboardingStatus,
  onOnboardingStatusChange,
  onClearAll,
  showingCount,
  totalCount,
  hasActiveFilters,
}: OpsSchoolsFiltersProps) {
  const t = useTranslations('Ops.schools');

  const accountStatusOptions = [
    { value: OPS_SCHOOLS_FILTER_ALL, label: t('filterAll') },
    ...SCHOOL_ACCOUNT_STATUSES.map((status) => ({
      value: status,
      label: t(`accountStatus.${status}`),
    })),
  ];

  const onboardingOptions = [
    { value: OPS_SCHOOLS_FILTER_ALL, label: t('filterAll') },
    ...SCHOOL_ONBOARDING_STATUSES.map((status) => ({
      value: status,
      label: t(`onboardingStatus.${status}`),
    })),
  ];

  return (
    <div className="flex flex-col gap-3" data-slot="ops-schools-filters">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="ops-schools-search"
            type="text"
            autoComplete="off"
            aria-label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput ? (
            <button
              type="button"
              aria-label={t('clearSearch')}
              onClick={() => onSearchInputChange('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <SelectField
            id="ops-schools-account-status"
            label={t('filterAccountStatus')}
            placeholder={t('filterAll')}
            options={accountStatusOptions}
            value={accountStatus}
            onValueChange={onAccountStatusChange}
            className="w-44"
          />
          <SelectField
            id="ops-schools-onboarding"
            label={t('filterOnboarding')}
            placeholder={t('filterAll')}
            options={onboardingOptions}
            value={onboardingStatus}
            onValueChange={onOnboardingStatusChange}
            className="w-44"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status">
          {t('showing', { showing: showingCount, total: totalCount })}
        </p>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 px-2 text-xs"
          >
            {t('clearFilters')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
