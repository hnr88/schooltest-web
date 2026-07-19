'use client';

import { List, Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { chipVariants } from '@/modules/school-search/lib/chip-variants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// Desktop-only (lg+) Map/List view toggle living in the chip row. Writes the shared
// `isMapOpen` via `toggleMap` (090); the sticky split reads the same flag. Neutral
// chip that swaps icon + label to the opposite action (Airbnb "Show map/list"); the
// changing visible label IS the accessible name, so no overriding aria-label.
function MapToggle() {
  const t = useTranslations('SchoolSearch.map');
  const isMapOpen = useSchoolSearchStore((s) => s.isMapOpen);
  const toggleMap = useSchoolSearchStore((s) => s.toggleMap);

  const Icon = isMapOpen ? List : MapIcon;

  return (
    <button
      type="button"
      onClick={toggleMap}
      className={cn('group ml-auto hidden lg:inline-flex', chipVariants({ active: false }))}
    >
      <Icon
        aria-hidden
        strokeWidth={1.75}
        className="size-4 transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-90 motion-reduce:transition-none"
      />
      {isMapOpen ? t('showList') : t('showMap')}
    </button>
  );
}

export { MapToggle };
