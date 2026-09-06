'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { FilterChipGroup, SelectField } from '@/modules/design-system';
import { YEAR_BANDS } from '@/modules/classes/constants/year-bands.constants';
import {
  OPS_CLASSES_FILTER_ALL,
  type OpsClassesFilterState,
  type OpsClassesStatusFilter,
  type OpsClassesYearFilter,
} from '@/modules/ops/hooks/use-classes-filter';
import { classListStatusSchema } from '@/modules/ops/lib/ops-classes-contract';

// OPS-038 — the Classes-tab toolbar, split out of OpsClassesTab so the tab
// stays under the 120-line component limit. Owns the status chips, the
// year-band select and the search box; all state lives in useClassesFilter.
const STATUSES = classListStatusSchema.options;

export function OpsClassesToolbar({ filter }: { filter: OpsClassesFilterState }) {
  const t = useTranslations('Ops.classesTab');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <FilterChipGroup
          ariaLabel={t('filterStatus')}
          value={filter.status}
          onValueChange={(value) => filter.setStatus(value as OpsClassesStatusFilter)}
          options={[
            { value: OPS_CLASSES_FILTER_ALL, label: t('filterAll') },
            ...STATUSES.map((value) => ({ value, label: t(`status.${value}`) })),
          ]}
        />
        <SelectField
          id="ops-classes-year"
          label={t('filterYear')}
          placeholder={t('filterYear')}
          options={[
            { value: OPS_CLASSES_FILTER_ALL, label: t('filterAll') },
            ...YEAR_BANDS.map((value) => ({ value, label: t(`year.${value}`) })),
          ]}
          value={filter.yearBand}
          onValueChange={(value) => filter.setYearBand(value as OpsClassesYearFilter)}
        />
      </div>
      <Input
        id="ops-classes-search"
        type="search"
        autoComplete="off"
        className="sm:max-w-64"
        aria-label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={filter.search}
        onChange={(event) => filter.setSearch(event.target.value)}
      />
    </div>
  );
}
