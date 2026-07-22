'use client';

import { useId } from 'react';

import { useTranslations } from 'next-intl';

import { FieldShell, FilterRailSection, Input } from '@/modules/design-system';
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

// Canonical never ships a range slider (`type="range"` appears 0 times in all three
// .dc.html files), so the tuition range stays two numeric fields — now wrapped in the
// canonical FieldShell so the label/helper rhythm matches every other form in the app.
// The ids are `useId`-derived: below `lg` this rail is ALSO rendered inside the filter
// sheet, and the hardcoded ids collided across the two copies.
function SchoolFeeRangeFilter() {
  const t = useTranslations('SchoolSearch');
  const fieldId = useId();
  const feeMin = useSchoolSearchStore((state) => state.feeMin);
  const feeMax = useSchoolSearchStore((state) => state.feeMax);
  const setFeeRange = useSchoolSearchStore((state) => state.setFeeRange);

  return (
    <FilterRailSection title={t('fee.label')}>
      <div className="flex flex-col gap-3">
        <p className="text-body-sm font-semibold text-foreground">
          {t('fee.readout', { min: toFeeThousands(feeMin), max: toFeeThousands(feeMax) })}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <FieldShell id={`${fieldId}-min`} label={t('fee.minimum')}>
            <Input
              id={`${fieldId}-min`}
              type="number"
              min={FEE_MIN_BOUND}
              max={feeMax}
              step={FEE_STEP}
              value={feeMin}
              onChange={(event) => setFeeRange(nextMinimumFee(event.target.value, feeMax), feeMax)}
            />
          </FieldShell>
          <FieldShell id={`${fieldId}-max`} label={t('fee.maximum')}>
            <Input
              id={`${fieldId}-max`}
              type="number"
              min={feeMin}
              max={FEE_MAX_BOUND}
              step={FEE_STEP}
              value={feeMax}
              onChange={(event) => setFeeRange(feeMin, nextMaximumFee(event.target.value, feeMin))}
            />
          </FieldShell>
        </div>
      </div>
    </FilterRailSection>
  );
}

export { SchoolFeeRangeFilter };
