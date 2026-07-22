'use client';

import { useState } from 'react';

import { Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/modules/design-system';
// Direct import (never the module barrel) so next/dynamic(ssr:false) is preserved.
import { SchoolResultsMapPanel } from '@/modules/school-search/components/SchoolResultsMapPanel';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';
import { chipVariants } from '@/modules/search-shared';

// Mobile-only (< lg) counterpart to the desktop map column, which is `hidden lg:block`.
// Local open state (default closed) — the Base UI sheet unmounts its content while
// closed, so Leaflet only boots on open.
function MobileMapSheet({ hits }: { hits: SchoolHit[] }) {
  const t = useTranslations('SchoolSearch.map');
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(chipVariants({ active: open }), 'group inline-flex lg:hidden')}>
        <MapIcon
          aria-hidden
          strokeWidth={1.75}
          className="size-4 transition-transform duration-200 ease-out-expo group-hover:scale-110 group-active:scale-90 motion-reduce:transition-none"
        />
        {t('showMap')}
      </SheetTrigger>
      {/* Full-bleed sheet: dvh height on the inner wrapper (viewport-relative, so it
          fills regardless of the primitive's default `h-auto` bottom sizing). */}
      <SheetContent side="bottom" className="gap-0 p-0 lg:hidden">
        <SheetTitle className="sr-only">{t('region')}</SheetTitle>
        <div className="h-dvh w-full overflow-hidden">
          {open ? <SchoolResultsMapPanel hits={hits} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { MobileMapSheet };
