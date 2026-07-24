'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { SupplementaryBandView } from '@/modules/report/types/supplementary.types';

// The same hatch the modelled bars use for "nothing was measured here"
// (E11-09), reused so one absence idiom runs across the whole report. An empty
// solid track would read as zero, which is a different claim.
const HATCH = 'repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 6px)';

// E11-05 — one out-of-model vocabulary band. The fill carries NO mastery status
// colour: a success/warning/danger tint would imply the cut score this strand
// must not have (Doc 0).
export function SupplementaryBandRow({
  band,
  revealed,
  index,
}: {
  band: SupplementaryBandView;
  revealed: boolean;
  index: number;
}) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const measured = band.state === 'measured';

  return (
    <li
      data-slot="report-supplementary-band"
      data-code={band.code}
      data-state={band.state}
      data-accuracy={measured ? band.accuracy : undefined}
      className="flex flex-col gap-2 border-b border-divider py-4 last:border-b-0"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-body-md font-semibold text-foreground">
          {t(`supplementaryBands.${band.code}`)}
        </span>
        <span
          data-slot="report-supplementary-value"
          className={
            measured
              ? 'text-body-lg font-bold text-foreground tabular-nums'
              : 'text-body-md font-semibold text-muted-foreground'
          }
        >
          {measured
            ? format.number(band.accuracy, { style: 'percent', maximumFractionDigits: 0 })
            : t('supplementaryNotAdministered')}
        </span>
      </div>

      {measured ? (
        <div
          role="img"
          aria-label={`${t(`supplementaryBands.${band.code}`)} ${t('supplementaryAccuracyLabel')}`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-inset"
        >
          <span
            aria-hidden="true"
            className="block h-full w-full origin-left rounded-full bg-teal-600 transition-transform duration-700 ease-out-expo motion-reduce:transition-none"
            style={{
              transform: `scaleX(${revealed ? band.accuracy : 0})`,
              transitionDelay: `${index * 80}ms`,
            }}
          />
        </div>
      ) : (
        <div
          role="img"
          aria-label={`${t(`supplementaryBands.${band.code}`)} ${t('supplementaryNotAdministered')}`}
          className="h-1.5 w-full rounded-full border border-divider text-muted-foreground/35"
          style={{ backgroundImage: HATCH }}
        />
      )}

      <p className="text-caption text-muted-foreground">
        {measured
          ? t(`supplementaryBandSource.${band.code}`)
          : t('supplementaryNotAdministeredNote')}
      </p>
    </li>
  );
}
