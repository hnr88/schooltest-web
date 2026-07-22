'use client';

import { useTranslations } from 'next-intl';

import {
  DEFAULT_SORT_BY,
  SORT_OPTION_LABEL_KEYS,
  SORT_OPTIONS,
} from '@/modules/school-search/constants/school-search.constants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { SortBy } from '@/modules/school-search/types/school-search.types';
import { SearchSortMenu } from '@/modules/search-shared';

// Binds the shared SearchSortMenu to the schools store — the whole sort control is
// now ONE component shared with the agents pane instead of two near-identical chips.
function SchoolSortMenu() {
  const t = useTranslations('SchoolSearch');
  const sortBy = useSchoolSearchStore((s) => s.sortBy);
  const setSort = useSchoolSearchStore((s) => s.setSort);

  return (
    <SearchSortMenu
      label={t('sort.label')}
      value={sortBy}
      isDefault={sortBy === DEFAULT_SORT_BY}
      onValueChange={(value) => setSort(value as SortBy)}
      options={SORT_OPTIONS.map((option) => ({
        value: option,
        label: t(`sortOptions.${SORT_OPTION_LABEL_KEYS[option]}`),
      }))}
    />
  );
}

export { SchoolSortMenu };
