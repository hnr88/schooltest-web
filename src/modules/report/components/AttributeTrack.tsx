'use client';

import { useTranslations } from 'next-intl';

import { ATTRIBUTE_STATUS_FILL } from '@/modules/report/constants/mastery.constants';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';

// A hatch rather than an empty grey track: an unfilled solid bar reads as "zero
// probability", which is a measurement claim. Hatching reads as "nothing was
// measured here" (E11-09).
const HATCH = 'repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 6px)';

export function AttributeTrack({
  row,
  revealed,
  index,
  probabilityLabel,
}: {
  row: AttributeRowView;
  revealed: boolean;
  index: number;
  probabilityLabel: string | null;
}) {
  const t = useTranslations('Report');

  if (row.state === 'not_assessed') {
    return (
      <div
        data-slot="report-attribute-track"
        data-state="not_assessed"
        role="img"
        aria-label={`${row.code} ${t('attributeStatus.not_assessed')}`}
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
        probabilityLabel === null
          ? `${row.code} ${t('attributeProbabilityLabel')}`
          : `${row.code} ${t('attributeProbabilityLabel')} ${probabilityLabel}`
      }
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-divider"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-full origin-left rounded-full transition-transform duration-700 ease-out-expo motion-reduce:transition-none ${ATTRIBUTE_STATUS_FILL[row.status]}`}
        style={{
          transform: `scaleX(${revealed ? row.probability : 0})`,
          transitionDelay: `${index * 60}ms`,
        }}
      />
      {row.confidence.kind === 'interval' ? (
        <span
          data-slot="report-attribute-interval"
          aria-hidden="true"
          className="absolute inset-y-0 rounded-full bg-foreground/25 transition-opacity duration-700 ease-out-expo motion-reduce:transition-none"
          style={{
            left: `${row.confidence.lower * 100}%`,
            width: `${(row.confidence.upper - row.confidence.lower) * 100}%`,
            opacity: revealed ? 1 : 0,
            transitionDelay: `${index * 60 + 200}ms`,
          }}
        />
      ) : null}
    </div>
  );
}
