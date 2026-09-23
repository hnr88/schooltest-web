'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { PHASE_LADDER_FILL, PHASE_LADDER_STEPS } from '@/modules/report/constants/mastery.constants';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';
import { HATCH } from '@/modules/report/constants/components.constants';

export function AttributeTrack({
  row,
  revealed,
  index,
}: {
  row: AttributeRowView;
  revealed: boolean;
  index: number;
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

  const step = PHASE_LADDER_STEPS.indexOf(row.status) + 1;

  return (
    <div
      data-slot="report-attribute-track"
      data-state="assessed"
      data-step={step}
      role="img"
      aria-label={t('attributeLadderLabel', {
        skill: name,
        phase: t(`attributeStatus.${row.status}`),
        step,
      })}
      className="grid w-full grid-cols-4 gap-1"
    >
      {PHASE_LADDER_STEPS.map((band, position) => (
        <span
          key={band}
          aria-hidden="true"
          data-slot="report-attribute-ladder-step"
          data-band={band}
          data-reached={position < step}
          data-current={position === step - 1}
          title={t(`attributeStatus.${band}`)}
          className={cn(
            'h-2.5 rounded-full transition-colors duration-700 ease-out-expo motion-reduce:transition-none',
            revealed && position < step ? PHASE_LADDER_FILL[row.status] : 'bg-divider',
          )}
          style={{ transitionDelay: `${index * 60 + position * 40}ms` }}
        />
      ))}
    </div>
  );
}
