'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { EVIDENCE_METER_FLOOR } from '@/modules/report/constants/mastery.constants';

// E11-04 — the item count that backs ONE claim, with an inline meter scaled to
// the largest count in the SAME result, so an attribute backed by 8 items reads
// visibly thinner than one backed by 73. The number is the datum; the meter is
// only a relative rendering of it, and nothing is summed across attributes.
export function EvidenceCount({
  items,
  scaleMax,
  className,
}: {
  items: number;
  scaleMax: number;
  className?: string;
}) {
  const t = useTranslations('Report');
  const share = scaleMax > 0 ? Math.max(EVIDENCE_METER_FLOOR, items / scaleMax) : 0;

  return (
    <span
      data-slot="report-evidence-count"
      data-items={items}
      title={t('evidenceLabel')}
      className={cn('inline-flex items-center gap-2 text-caption text-muted-foreground', className)}
    >
      <span aria-hidden="true" className="block h-1 w-10 overflow-hidden rounded-full bg-divider">
        <span
          className="block h-full w-full origin-left rounded-full bg-muted-foreground/70"
          style={{ transform: `scaleX(${share})` }}
        />
      </span>
      <span className="tabular-nums">{t('evidenceItems', { count: items })}</span>
    </span>
  );
}
