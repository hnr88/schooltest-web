'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
// Direct import (never the module barrel) so next/dynamic(ssr:false) is preserved.
import { SchoolResultsMapPanel } from '@/modules/school-search/components/SchoolResultsMapPanel';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// Airbnb-style split: the results card column (`children`) on the left, a sticky
// Leaflet map pinned on the right (lg+). When the map is closed the grid collapses to
// a single full-width column and the map column drops out. The map column is
// `hidden lg:block` — on mobile the map lives in MobileMapSheet instead.
function SchoolsSplitLayout({
  isMapOpen,
  hits,
  children,
}: {
  isMapOpen: boolean;
  hits: SchoolHit[];
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 duration-300 ease-out animate-in fade-in motion-reduce:animate-none',
        isMapOpen && 'lg:grid-cols-12',
      )}
    >
      <div className={cn('min-w-0', isMapOpen && 'lg:col-span-5')}>{children}</div>
      {isMapOpen ? (
        <aside className="hidden lg:sticky lg:top-6 lg:col-span-7 lg:block lg:h-screen">
          <div className="h-full overflow-hidden rounded-lg border border-border shadow-2">
            <SchoolResultsMapPanel hits={hits} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}

export { SchoolsSplitLayout };
