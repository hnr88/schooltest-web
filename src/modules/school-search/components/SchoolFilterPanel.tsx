'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { SchoolFeeRangeFilter } from '@/modules/school-search/components/SchoolFeeRangeFilter';
import { SchoolFilterControls } from '@/modules/school-search/components/SchoolFilterControls';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

function SchoolFilterPanel() {
  const t = useTranslations('SchoolSearch');
  const clearFilters = useSchoolSearchStore((state) => state.clearFilters);

  return (
    <section
      data-slot="school-filter-panel"
      aria-labelledby="school-filter-heading"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="school-filter-heading" className="text-base font-bold text-navy-950">
          {t('filterPanel.title')}
        </h2>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          {t('filterPanel.clear')}
        </Button>
      </div>
      <SchoolFilterControls />
      <SchoolFeeRangeFilter />
    </section>
  );
}

export { SchoolFilterPanel };
