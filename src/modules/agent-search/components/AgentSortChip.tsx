'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { DEFAULT_SORT, SORT_OPTIONS } from '@/modules/agent-search/constants/agent-search.constants';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import type { AgentSortBy } from '@/modules/agent-search/types/agent-search.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/modules/design-system';
import { chipVariants } from '@/modules/search-shared';

function AgentSortChip() {
  const t = useTranslations('AgentSearch');
  const sort = useAgentSearchStore((s) => s.sort);
  const setSort = useAgentSearchStore((s) => s.setSort);

  const isActive = sort !== DEFAULT_SORT;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('group', chipVariants({ active: isActive }))}>
        {t('sort.label')}: {t(`sortOptions.${sort}`)}
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value: string) => setSort(value as AgentSortBy)}
        >
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t(`sortOptions.${option}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AgentSortChip };
