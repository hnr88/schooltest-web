'use client';

import { List, Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import { chipVariants } from '@/modules/search-shared';

// Desktop-only (lg+) Map/List view toggle in the results panel header. Writes the
// shared `isMapOpen`; the workspace grid reads the same flag and drops the map column.
// The changing visible label IS the accessible name, so no overriding aria-label.
// The display utilities come AFTER the variant in cn(): `chipVariants` sets
// `inline-flex`, and tailwind-merge keeps the last class in the display group — with
// the old order the chip stayed visible at 375 and overflowed the toolbar.
function MapToggle() {
  const t = useTranslations('SchoolSearch.map');
  const isMapOpen = useSchoolSearchStore((s) => s.isMapOpen);
  const toggleMap = useSchoolSearchStore((s) => s.toggleMap);

  const Icon = isMapOpen ? List : MapIcon;

  return (
    <button
      type="button"
      onClick={toggleMap}
      className={cn(chipVariants({ active: false }), 'group hidden lg:inline-flex')}
    >
      <Icon
        aria-hidden
        strokeWidth={1.75}
        className="size-4 transition-transform duration-200 ease-out-expo group-hover:scale-110 group-active:scale-90 motion-reduce:transition-none"
      />
      {isMapOpen ? t('showList') : t('showMap')}
    </button>
  );
}

export { MapToggle };
