'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  MASTERY_BAND_LABEL_KEY,
  MASTERY_BAND_TILE_CLASS,
} from '@/modules/teacher/constants/drill-down.constants';
import { subskillTileView } from '@/modules/teacher/lib/student-drill-down';
import type { SubskillTileProps } from '@/modules/teacher/types/student-drill-down.types';

// One tile of .qa/DESIGN.md §Student drill-down: the subskill's display NAME, the
// big LIKELIHOOD percentage, and the band's WORD.
//
// The name is C-TR-2's `name` — the active crosswalk's descriptor, never a client
// codebook. The percentage is the server's `likelihood`, printed as it arrived.
// The tint is `MASTERY_BAND_TILE_CLASS[status]`, keyed by the server's own band:
// this component never sees a cut, so it cannot re-threshold one.
//
// WCAG 2.2 AA 1.4.1: the band word is real text on every tile, so the three
// colours are never the only signal. The NOT-ASSESSED arm prints no percentage at
// all — `0%` would claim a measurement this result does not hold.
function SubskillTile({ subskill }: SubskillTileProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const view = subskillTileView(subskill);

  return (
    <li
      data-slot="subskill-tile"
      data-attribute={subskill.attribute}
      data-band={view.status}
      className={cn(
        'flex min-h-24 flex-col gap-1 rounded-tile px-3.5 py-3',
        MASTERY_BAND_TILE_CLASS[view.status],
      )}
    >
      <span className="text-meta font-semibold break-words">{subskill.name}</span>

      {view.measured ? (
        <span
          data-slot="subskill-tile-likelihood"
          className="text-h3 leading-tight font-bold tabular-nums"
        >
          {t('likelihoodValue', { likelihood: view.likelihood })}
        </span>
      ) : null}

      <span
        data-slot="subskill-tile-band"
        className="text-caption font-bold tracking-wide uppercase"
      >
        {t(MASTERY_BAND_LABEL_KEY[view.status])}
      </span>
    </li>
  );
}

export { SubskillTile };
