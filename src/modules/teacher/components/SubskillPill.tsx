'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  MASTERY_BAND_LABEL_KEY,
  MASTERY_BAND_TILE_CLASS,
} from '@/modules/teacher/constants/drill-down.constants';
import { subskillTileView } from '@/modules/teacher/lib/student-drill-down';
import type { SubskillPillProps } from '@/modules/teacher/types/student-drill-down.types';

// One coloured pill of the COLLAPSED older test (.qa/DESIGN.md §Both tests
// completed: "a row of coloured pills, one per subskill, each <name> <pct>, tinted
// by that subskill's band").
//
// The tint is `MASTERY_BAND_TILE_CLASS[status]` — the SERVER's band, the same map
// the full tiles use. This component never sees a cut, so it cannot re-threshold
// one, and the pill still prints the band's own WORD: at a glance the row reads as
// colour, but the information survives greyscale (WCAG 2.2 AA 1.4.1).
//
// The NAME is C-TR-2's `name`, the active crosswalk's descriptor. The wireframe's
// abbreviations ("Vocab", "Infer", "Crit") are NOT reproduced: shortening them
// client-side would be exactly the frontend codebook .qa/DESIGN.md §Subskill
// naming forbids. An unassessed attribute prints no percentage at all.
function SubskillPill({ subskill }: SubskillPillProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const view = subskillTileView(subskill);

  return (
    <li
      data-slot="subskill-pill"
      data-attribute={subskill.attribute}
      data-band={view.status}
      className={cn(
        'flex flex-wrap items-baseline gap-x-1.5 rounded-full px-3 py-1.5',
        MASTERY_BAND_TILE_CLASS[view.status],
      )}
    >
      <span className="text-meta font-semibold break-words">{subskill.name}</span>
      {view.measured ? (
        <span data-slot="subskill-pill-likelihood" className="text-meta font-bold tabular-nums">
          {t('likelihoodValue', { likelihood: view.likelihood })}
        </span>
      ) : null}
      <span
        data-slot="subskill-pill-band"
        className="text-caption font-bold tracking-wide uppercase"
      >
        {t(MASTERY_BAND_LABEL_KEY[view.status])}
      </span>
    </li>
  );
}

export { SubskillPill };
