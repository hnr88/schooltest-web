'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { MASTERY_BAND_TILE_CLASS } from '@/modules/teacher/constants/drill-down.constants';
import type { MasteryLegendProps } from '@/modules/teacher/types/student-drill-down.types';

// The wireframe's legend — "Mastery likelihood: >=80% mastered · 50-79%
// approaching" — rendered FROM THE SERVER'S OWN CUTS: `bands` is C-TR-2's verbatim
// echo of `Config.teacher_mastery_bands`, formatted as percentages for reading.
//
// This is a LABEL, not a rule. The two numbers are display output, and nothing
// here (or anywhere in this slice) compares a likelihood to them — the tiles are
// coloured by the `status` the server already derived. Retune the Config row and
// this sentence retunes with the tiles, from the same single source, with no code
// change.
function MasteryLegend({ bands }: MasteryLegendProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const format = useFormatter();
  const percent = (cut: number) =>
    format.number(cut, { style: 'percent', maximumFractionDigits: 0 });

  return (
    <p
      data-slot="mastery-legend"
      data-mastered-cut={bands.mastered_cut}
      data-approaching-cut={bands.approaching_cut}
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-meta text-muted-foreground"
    >
      <span className="font-semibold">{t('legendLabel')}</span>
      <span className={cn('rounded-full px-2 py-0.5', MASTERY_BAND_TILE_CLASS.mastered)}>
        {t('legendMastered', { cut: percent(bands.mastered_cut) })}
      </span>
      <span className={cn('rounded-full px-2 py-0.5', MASTERY_BAND_TILE_CLASS.approaching)}>
        {t('legendApproaching', {
          from: percent(bands.approaching_cut),
          to: percent(bands.mastered_cut),
        })}
      </span>
      <span className={cn('rounded-full px-2 py-0.5', MASTERY_BAND_TILE_CLASS.not_yet)}>
        {t('legendNotYet', { cut: percent(bands.approaching_cut) })}
      </span>
    </p>
  );
}

export { MasteryLegend };
