'use client';

import { useTranslations } from 'next-intl';

import { SubskillTile } from '@/modules/teacher/components/SubskillTile';
import type { SubskillTileGridProps } from '@/modules/teacher/types/student-drill-down.types';

// The tile row of .qa/DESIGN.md §Student drill-down, in C-TR-2's OWN order — the
// server sends the reading attributes in `ATTRIBUTE_ORDER.reading`, and the grid
// re-sorts nothing, drops nothing and adds no attribute the result did not carry.
//
// A real `<ul>`: the tiles are a list of seven peers, so a screen reader announces
// "list, 7 items" and each tile is one item. The list is named by the test card's
// own heading through `aria-labelledby`, which keeps the heading order intact
// (h1 student · h2 test · the list under it) without inventing an h3.
function SubskillTileGrid({ variant, subskills }: SubskillTileGridProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const headingId = `subskill-tiles-${variant}`;

  return (
    <section data-slot="subskill-tile-grid" aria-labelledby={headingId}>
      <h3 id={headingId} className="pb-2 text-meta font-semibold text-muted-foreground">
        {t('subskillsHeading')}
      </h3>
      <ul
        data-slot="subskill-tile-list"
        data-tile-count={subskills.length}
        className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {subskills.map((subskill) => (
          <SubskillTile key={subskill.attribute} subskill={subskill} />
        ))}
      </ul>
    </section>
  );
}

export { SubskillTileGrid };
