'use client';

import { useTranslations } from 'next-intl';

import { AgentsPane } from '@/modules/agent-search';
import { SchoolsPane } from '@/modules/school-search';
import { SearchModeTabs } from '@/modules/unified-search/components/SearchModeTabs';
import { UnifiedSearchBar } from '@/modules/unified-search/components/UnifiedSearchBar';
import { useSearchModeSync } from '@/modules/unified-search/hooks/use-search-mode-sync';

// C-UI-SEARCH-UNIFIED: ONE page hosts both searches. Owns the page chrome hoisted
// out of the panes — content padding 28px 32px, the mode-aware heading, the mode
// selector + the single §5.4 search bar (085) row — then swaps the active pane.
// The `key={mode}` remount replays the content entrance on every switch; the panes
// keep their own Zustand q so the switch never bleeds one query into the other.
function UnifiedSearchScreen() {
  const t = useTranslations('UnifiedSearch');
  const { mode, setMode } = useSearchModeSync();
  const isSchools = mode === 'schools';

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-7">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-navy-950">
          {isSchools ? t('titleSchools') : t('titleAgents')}
        </h1>
        <p className="text-sm text-body">
          {isSchools ? t('subtitleSchools') : t('subtitleAgents')}
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <SearchModeTabs mode={mode} onModeChange={setMode} />
        <UnifiedSearchBar mode={mode} />
      </div>
      <div
        key={mode}
        className="flex flex-1 flex-col duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
      >
        {isSchools ? <SchoolsPane /> : <AgentsPane />}
      </div>
    </div>
  );
}

export { UnifiedSearchScreen };
