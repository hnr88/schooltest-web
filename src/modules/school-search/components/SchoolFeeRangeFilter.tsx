'use client';

import { useTranslations } from 'next-intl';

import { Button, Input, Label } from '@/modules/design-system';
import { SchoolFilterSection } from '@/modules/school-search/components/SchoolFilterSection';
import {
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
  FEE_STEP,
} from '@/modules/school-search/constants/school-search.constants';
import {
  nextMaximumFee,
  nextMinimumFee,
  toFeeThousands,
} from '@/modules/school-search/lib/fee-range';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

function SchoolFeeRangeFilter() {
  const t = useTranslations('SchoolSearch');
  const feeMin = useSchoolSearchStore((state) => state.feeMin);
  const feeMax = useSchoolSearchStore((state) => state.feeMax);
  const setFeeRange = useSchoolSearchStore((state) => state.setFeeRange);
  const isNarrowed = feeMin > FEE_MIN_BOUND || feeMax < FEE_MAX_BOUND;

  return (
    <SchoolFilterSection title={t('fee.label')}>
      <p className="text-sm font-semibold text-foreground">
        {t('fee.readout', { min: toFeeThousands(feeMin), max: toFeeThousands(feeMax) })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="school-fee-minimum">{t('fee.minimum')}</Label>
          <Input
            id="school-fee-minimum"
            type="number"
            min={FEE_MIN_BOUND}
            max={feeMax}
            step={FEE_STEP}
            value={feeMin}
            onChange={(event) => setFeeRange(nextMinimumFee(event.target.value, feeMax), feeMax)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="school-fee-maximum">{t('fee.maximum')}</Label>
          <Input
            id="school-fee-maximum"
            type="number"
            min={feeMin}
            max={FEE_MAX_BOUND}
            step={FEE_STEP}
            value={feeMax}
            onChange={(event) => setFeeRange(feeMin, nextMaximumFee(event.target.value, feeMin))}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        disabled={!isNarrowed}
        onClick={() => setFeeRange(FEE_MIN_BOUND, FEE_MAX_BOUND)}
      >
        {t('fee.clear')}
      </Button>
    </SchoolFilterSection>
  );
}

export { SchoolFeeRangeFilter };
