'use client';

import { Search, UserSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsList, TabsTrigger } from '@/modules/design-system';
import { SEARCH_MODES } from '@/modules/unified-search/constants/unified-search.constants';
import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

const MODE_ICONS = { schools: Search, agents: UserSearch } as const;

interface SearchModeTabsProps {
  mode: UnifiedSearchMode;
  onModeChange: (next: UnifiedSearchMode) => void;
}

// C-UI-SEARCH-UNIFIED §5.10: segmented pill built from the DS Tabs primitive.
// value=mode; onValueChange routes through use-search-mode-sync (?mode=). Active
// segment is the solid --sidebar-primary pill (white 600), idle slate-600 with a
// slate hover. transition-colors animates the active indicator (never snaps) and
// motion-reduce disables it — MOTION & POLISH BASELINE (D-UI-2).
function SearchModeTabs({ mode, onModeChange }: SearchModeTabsProps) {
  const t = useTranslations('UnifiedSearch');

  return (
    <Tabs value={mode} onValueChange={(value) => onModeChange(value as UnifiedSearchMode)}>
      <TabsList
        aria-label={t('modeSelectorLabel')}
        className="h-auto gap-1 rounded-xl bg-muted p-1"
      >
        {SEARCH_MODES.map((value) => {
          const Icon = MODE_ICONS[value];
          const label = value === 'schools' ? t('modeSchools') : t('modeAgents');

          return (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition-colors duration-200 ease-out hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-ring data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:shadow-sm motion-reduce:transition-none"
            >
              <Icon aria-hidden="true" className="size-3.75" />
              <span>{label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

export { SearchModeTabs };
