'use client';

import { useTranslations } from 'next-intl';

import { SchoolFilterControls } from '@/modules/school-search/components/SchoolFilterControls';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import { SearchFiltersDialog } from '@/modules/search-shared';

// Binds the shared §8.6 overlay to the schools store. The persistent 248px rail is
// gone from this surface — the design has no rail on "Find a school", it has ONE
// "All filters" button at every width — but the GROUPS inside are the same canonical
// FilterRailSection + ChoicePillGroup controls, so the request shape and the
// aria-pressed contract the specs drive are untouched.
function SchoolFiltersDialog({
  activeCount,
  resultCount,
}: {
  activeCount: number;
  resultCount: number;
}) {
  const t = useTranslations('SchoolSearch');
  const clearFilters = useSchoolSearchStore((state) => state.clearFilters);

  return (
    <SearchFiltersDialog
      triggerLabel={t('filterPanel.trigger')}
      title={t('filterPanel.title')}
      description={t('filterPanel.description')}
      activeCount={activeCount}
      countLabel={t('filterPanel.activeCount', { count: activeCount })}
      closeLabel={t('filterPanel.close')}
      clearLabel={t('filterPanel.clear')}
      applyLabel={t('filterPanel.apply', { count: resultCount })}
      onClear={clearFilters}
    >
      <div data-slot="school-filter-panel" className="flex flex-col gap-2">
        <SchoolFilterControls />
      </div>
    </SearchFiltersDialog>
  );
}

export { SchoolFiltersDialog };
