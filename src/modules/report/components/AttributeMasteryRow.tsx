'use client';

import { useTranslations } from 'next-intl';

import { StatusPill, TrendDelta } from '@/modules/design-system';
import { AttributeTrack } from '@/modules/report/components/AttributeTrack';
import { EvidenceCount } from '@/modules/report/components/EvidenceCount';
import { ATTRIBUTE_STATUS_TONE } from '@/modules/report/constants/mastery.constants';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';
import { ROW_CLASS } from '@/modules/report/constants/components.constants';

function deltaTone(deltaDisplay: string): 'positive' | 'negative' | 'neutral' {
  const first = deltaDisplay.charAt(0);
  if (first === '+') return 'positive';
  if (first === '-' || first === '−') return 'negative';
  return 'neutral';
}

// One attribute. The ASSESSED arm shows the domain score, the wire status band,
// the evidence count and the delta; the NOT-ASSESSED arm shows a hatched empty
// track and a sentence, with no score, no delta and no evidence meter. The
// score comes from `domain_score` only — posterior fields are audit-only and
// never rendered — and the delta is `delta_display` verbatim.
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
  const name = t(`attributes.${row.name}`);
  const statusKey = row.state === 'assessed' ? row.status : 'not_assessed';
  const score = row.state === 'assessed' ? String(row.domainScore) : null;

  return (
    <li
      data-slot="report-attribute-row"
      data-state={row.state}
      data-attribute={row.name}
      className={ROW_CLASS}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="rounded-md bg-muted px-2 py-0.5 text-meta font-bold text-secondary-foreground tabular-nums">
          {name}
        </span>
        <StatusPill tone={row.state === 'assessed' ? ATTRIBUTE_STATUS_TONE[row.status] : 'neutral'}>
          {t(`attributeStatus.${statusKey}`)}
        </StatusPill>
        {score !== null ? (
          <span
            data-slot="report-attribute-score"
            className="ml-auto text-body-md font-bold text-foreground tabular-nums"
          >
            {score}
          </span>
        ) : null}
      </div>

      <AttributeTrack row={row} revealed={revealed} index={index} scoreLabel={score} />

      {row.state === 'assessed' ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <EvidenceCount itemsSeen={row.itemsSeen} scaleMax={scaleMax} />
          {row.deltaDisplay !== null ? (
            <TrendDelta
              tone={deltaTone(row.deltaDisplay)}
              label={t('deltaSincePrevious', { delta: row.deltaDisplay })}
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
