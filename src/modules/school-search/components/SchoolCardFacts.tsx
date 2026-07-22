'use client';

import { Check } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { TUITION_CURRENCY } from '@/modules/school-search/constants/school-search.constants';
import { getSchoolFactKeys } from '@/modules/school-search/lib/school-card.helpers';
import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// The card FOOTER of spec 01 §8.4: a hairline rule, then blue-tick facts separated by
// dots with the one hard number pushed to the end.
// The design's tick reads "Accepts SchoolTest placement" on every card — CONTRACTS
// B-12 records that no field backs that claim, so the ticks here carry only what the
// response actually says (scholarships / ELICOS / ATAR / CRICOS) and a school with
// none of them renders no ticks rather than a fabricated one.
function SchoolCardFacts({ hit }: { hit: SchoolHit }) {
  const t = useTranslations('SchoolSearch');
  const format = useFormatter();
  const facts = getSchoolFactKeys(hit);

  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-divider pt-3.5 text-meta text-muted-foreground">
      {facts.map((key) => (
        <span key={key} className="inline-flex min-w-0 items-center gap-1.5">
          <Check aria-hidden="true" className="size-3.25 shrink-0 stroke-3 text-primary" />
          <span className="truncate">{t(`facts.${key}`)}</span>
        </span>
      ))}
      <span className="ml-auto shrink-0 font-semibold text-foreground">
        {hit.annualTuitionFrom === null
          ? t('card.tuitionUnknown')
          : t.rich('card.tuition', {
              amount: format.number(hit.annualTuitionFrom, {
                style: 'currency',
                currency: TUITION_CURRENCY,
                maximumFractionDigits: 0,
                currencyDisplay: 'narrowSymbol',
              }),
              strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
            })}
      </span>
    </div>
  );
}

export { SchoolCardFacts };
