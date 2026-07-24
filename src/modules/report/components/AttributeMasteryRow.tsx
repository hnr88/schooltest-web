'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { StatusPill, TrendDelta } from '@/modules/design-system';
import { AttributeTrack } from '@/modules/report/components/AttributeTrack';
import { EvidenceCount } from '@/modules/report/components/EvidenceCount';
import { ATTRIBUTE_STATUS_TONE } from '@/modules/report/constants/mastery.constants';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';

const ROW_CLASS =
  'flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none';

// E11-03 / E11-09 — one attribute. The ASSESSED arm shows the mastery
// probability, the wire status band, the evidence count and the delta; the
// NOT-ASSESSED arm shows a hatched empty track and a sentence, with no
// percentage, no delta and no evidence meter. There is no `p: number` prop that
// could quietly become 0.
export function AttributeMasteryRow({
  row,
  scaleMax,
  revealed,
  index,
}: {
  row: AttributeRowView;
  scaleMax: number;
  revealed: boolean;
  index: number;
}) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const statusKey = row.state === 'assessed' ? row.status : 'not_assessed';
  const percent =
    row.state === 'assessed'
      ? format.number(row.probability, { style: 'percent', maximumFractionDigits: 1 })
      : null;

  return (
    <li
      data-slot="report-attribute-row"
      data-state={row.state}
      data-code={row.code}
      className={ROW_CLASS}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          aria-label={`${t('attributeCodeLabel')} ${row.code}`}
          className="rounded-md bg-muted px-2 py-0.5 text-meta font-bold text-secondary-foreground tabular-nums"
        >
          {row.code}
        </span>
        <StatusPill tone={row.state === 'assessed' ? ATTRIBUTE_STATUS_TONE[row.status] : 'neutral'}>
          {t(`attributeStatus.${statusKey}`)}
        </StatusPill>
        {percent !== null ? (
          <span
            data-slot="report-attribute-probability"
            className="ml-auto text-body-md font-bold text-foreground tabular-nums"
          >
            {percent}
          </span>
        ) : null}
      </div>

      <AttributeTrack row={row} revealed={revealed} index={index} probabilityLabel={percent} />

      {row.state === 'assessed' ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <EvidenceCount items={row.items} scaleMax={scaleMax} />
          {row.delta !== null ? (
            <TrendDelta
              tone={row.delta > 0 ? 'positive' : row.delta < 0 ? 'negative' : 'neutral'}
              label={t('deltaSincePrevious', {
                delta: format.number(row.delta, {
                  signDisplay: 'exceptZero',
                  maximumFractionDigits: 2,
                }),
              })}
            />
          ) : null}
          {row.confidence.kind === 'interval' ? (
            <span data-slot="report-attribute-se" className="text-caption text-muted-foreground">
              {t('confidenceIntervalLabel', {
                se: format.number(row.confidence.se, { maximumFractionDigits: 3 }),
              })}
            </span>
          ) : null}
        </div>
      ) : (
        <p
          data-slot="report-attribute-not-assessed-note"
          className="text-caption text-muted-foreground"
        >
          {t('attributeNotAssessedNote')}
        </p>
      )}
    </li>
  );
}
