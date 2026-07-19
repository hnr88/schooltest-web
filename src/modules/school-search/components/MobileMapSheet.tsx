'use client';

import { useState } from 'react';

import { Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/modules/design-system';
import { chipVariants } from '@/modules/school-search/lib/chip-variants';
// Direct import (never the module barrel) so next/dynamic(ssr:false) is preserved.
import { SchoolResultsMapPanel } from '@/modules/school-search/components/SchoolResultsMapPanel';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// Mobile-only (< lg) counterpart to the desktop sticky split: the sticky column is
// `hidden lg:block`, so on small screens the map is hidden by default and opened as a
// full-bleed bottom sheet from the chip row. Local open state (default closed) — the
// Base UI sheet unmounts its content while closed, so Leaflet only boots on open.
function MobileMapSheet({ hits }: { hits: SchoolHit[] }) {
  const t = useTranslations('SchoolSearch.map');
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn('group ml-auto lg:hidden', chipVariants({ active: open }))}
      >
        <MapIcon
          aria-hidden
          strokeWidth={1.75}
          className="size-4 transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-90 motion-reduce:transition-none"
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
