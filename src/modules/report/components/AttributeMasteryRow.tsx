'use client';

import { useTranslations } from 'next-intl';

import { StatusPill, TrendDelta } from '@/modules/design-system';
import { AttributeTrack } from '@/modules/report/components/AttributeTrack';
import { EvidenceCount } from '@/modules/report/components/EvidenceCount';
import { ATTRIBUTE_STATUS_TONE } from '@/modules/report/constants/mastery.constants';
import type { AttributeDeltaView, AttributeRowView } from '@/modules/report/types/attribute.types';
import { ROW_CLASS } from '@/modules/report/constants/components.constants';

function deltaTone(delta: AttributeDeltaView): 'positive' | 'negative' | 'neutral' {
  if (delta.kind !== 'points') return 'neutral';
  const first = delta.display.charAt(0);
  if (first === '+') return 'positive';
  if (first === '-' || first === '−') return 'negative';
  return 'neutral';
}

// One attribute. The ASSESSED arm shows the wire status band as its step on the
// four-step ACARA phase ladder (no score, no percentage), the evidence count and
// the delta; the NOT-ASSESSED arm shows a hatched empty track and a sentence,
// with no step, no delta and no evidence meter. Posterior fields are audit-only
// and never rendered, and the delta is the server's claim in words: a signed
// step verbatim, `steady` and band pairs through the catalogue, never a raw token.
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
  const tResults = useTranslations('Results');
  const name = t(`attributes.${row.name}`);
  const statusKey = row.state === 'assessed' ? row.status : 'not_assessed';
  const deltaWords = (delta: AttributeDeltaView): string => {
    if (delta.kind === 'points') return delta.display;
    if (delta.kind === 'steady') return tResults('steady');
    if (delta.kind === 'band_movement') return tResults('bandMovement');
    return `${t(`attributeStatus.${delta.before}`)} → ${t(`attributeStatus.${delta.after}`)}`;
  };

  return (
    <li
      data-slot="report-attribute-row"
      data-state={row.state}
      data-attribute={row.name}
      className={ROW_CLASS}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className="max-w-full truncate rounded-md bg-muted px-2 py-0.5 text-meta font-bold text-secondary-foreground tabular-nums"
          title={name}
        >
          {name}
        </span>
        <StatusPill tone={row.state === 'assessed' ? ATTRIBUTE_STATUS_TONE[row.status] : 'neutral'}>
          {t(`attributeStatus.${statusKey}`)}
        </StatusPill>
      </div>

      <AttributeTrack row={row} revealed={revealed} index={index} />

      {row.state === 'assessed' ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <EvidenceCount itemsSeen={row.itemsSeen} scaleMax={scaleMax} />
          {row.delta !== null ? (
            <TrendDelta
              tone={deltaTone(row.delta)}
              label={t('deltaSincePrevious', { delta: deltaWords(row.delta) })}
            />
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
