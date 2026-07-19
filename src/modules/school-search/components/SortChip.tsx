'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  DEFAULT_SORT_BY,
  SORT_OPTION_LABEL_KEYS,
  SORT_OPTIONS,
} from '@/modules/school-search/constants/school-search.constants';
import { chipVariants } from '@/modules/school-search/lib/chip-variants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { SortBy } from '@/modules/school-search/types/school-search.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/modules/design-system';

function SortChip() {
  const t = useTranslations('SchoolSearch');
  const sortBy = useSchoolSearchStore((s) => s.sortBy);
  const setSort = useSchoolSearchStore((s) => s.setSort);

  const isActive = sortBy !== DEFAULT_SORT_BY;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('group', chipVariants({ active: isActive }))}>
        {t('sort.label')}: {t(`sortOptions.${SORT_OPTION_LABEL_KEYS[sortBy]}`)}
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sortBy}
          onValueChange={(value: string) => setSort(value as SortBy)}
        >
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t(`sortOptions.${SORT_OPTION_LABEL_KEYS[option]}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SortChip };
