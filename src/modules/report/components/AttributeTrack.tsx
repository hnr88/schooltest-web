'use client';

import { useTranslations } from 'next-intl';

import { ATTRIBUTE_STATUS_FILL } from '@/modules/report/constants/mastery.constants';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';
import { HATCH } from '@/modules/report/constants/components.constants';

export function AttributeTrack({
  row,
  revealed,
  index,
  scoreLabel,
}: {
  row: AttributeRowView;
  revealed: boolean;
  index: number;
  scoreLabel: string | null;
}) {
  const t = useTranslations('Report');
  const name = t(`attributes.${row.name}`);

  if (row.state === 'not_assessed') {
    return (
      <div
        data-slot="report-attribute-track"
        data-state="not_assessed"
        role="img"
        aria-label={`${name} ${t('attributeStatus.not_assessed')}`}
        className="h-2.5 w-full rounded-full border border-divider text-muted-foreground/35"
        style={{ backgroundImage: HATCH }}
      />
    );
  }

  return (
    <div
      data-slot="report-attribute-track"
      data-state="assessed"
      role="img"
      aria-label={
        scoreLabel === null
          ? `${name} ${t('attributeScoreLabel')}`
          : `${name} ${t('attributeScoreLabel')} ${scoreLabel}`
      }
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-divider"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-full origin-left rounded-full transition-transform duration-700 ease-out-expo motion-reduce:transition-none ${ATTRIBUTE_STATUS_FILL[row.status]}`}
        style={{
          transform: `scaleX(${revealed ? row.domainScore / 100 : 0})`,
          transitionDelay: `${index * 60}ms`,
        }}
      />
    </div>
  );
}
