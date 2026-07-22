'use client';

import { useTranslations } from 'next-intl';

import { AgentsPane } from '@/modules/agent-search';
import { SchoolsPane } from '@/modules/school-search';
import { SearchModeTabs } from '@/modules/unified-search/components/SearchModeTabs';
import { UnifiedSearchBar } from '@/modules/unified-search/components/UnifiedSearchBar';
import { useSearchModeSync } from '@/modules/unified-search/hooks/use-search-mode-sync';

// C-UI-SEARCH-UNIFIED: ONE page hosts both searches, drawn as the design's "Find a
// school" header (spec 01 §8.1) — a 30px/500 title with its sub-line on the left and
// the search pill pinned to the right of the same baseline row.
// THE VIEWPORT IS THE FRAME. From `lg` up this screen is `min-h-0` inside the
// dashboard scrollport, the header band is `shrink-0`, and the workspace is
// `flex-1 min-h-0` — so the page's own scrollHeight can never exceed its clientHeight
// and every long region scrolls inside its own box instead.
// Below `lg` the panes stack (canonical has no side-by-side layout at phone widths)
// and the document takes ONE ordinary page scroll.
function UnifiedSearchScreen() {
  const t = useTranslations('UnifiedSearch');
  const { mode, setMode } = useSearchModeSync();
  const isSchools = mode === 'schools';

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:min-h-0 lg:px-8 lg:py-6">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-portal-title font-medium text-foreground">
            {isSchools ? t('titleSchools') : t('titleAgents')}
          </h1>
          <p className="text-body-md text-body">
            {isSchools ? t('subtitleSchools') : t('subtitleAgents')}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:justify-end">
          <SearchModeTabs mode={mode} onModeChange={setMode} />
          <UnifiedSearchBar mode={mode} />
        </div>
      </header>
      <div
        key={mode}
        className="flex flex-1 flex-col duration-300 ease-out-expo animate-in fade-in slide-in-from-bottom-2 lg:min-h-0 motion-reduce:animate-none"
      >
        {isSchools ? <SchoolsPane /> : <AgentsPane />}
      </div>
    </div>
  );
}

export { UnifiedSearchScreen };
