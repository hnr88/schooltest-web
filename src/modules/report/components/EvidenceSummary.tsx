'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { AttributeEvidence } from '@/modules/report/types/attribute.types';

// E11-04 — the same evidence, stated once next to the claims that DERIVE from
// the attribute map (the display label and the readiness lookup) rather than
// only on the bars themselves. Coverage plus the per-attribute range: never a
// sum, because one item may load several attributes.
export function EvidenceSummary({
  evidence,
  className,
}: {
  evidence: AttributeEvidence;
  className?: string;
}) {
  const t = useTranslations('Report');

  return (
    <p
      data-slot="report-evidence-summary"
      data-state={evidence.state}
      className={cn('text-caption text-muted-foreground', className)}
    >
      {evidence.state === 'assessed'
        ? t('evidenceSummaryAssessed', {
            assessed: evidence.assessed,
            total: evidence.total,
            min: evidence.minItems,
            max: evidence.maxItems,
          })
        : t('evidenceSummaryNoneAssessed', { total: evidence.total })}
    </p>
  );
}
