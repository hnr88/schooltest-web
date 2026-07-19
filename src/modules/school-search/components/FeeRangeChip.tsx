'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import {
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
  FEE_STEP,
} from '@/modules/school-search/constants/school-search.constants';
import { chipVariants } from '@/modules/school-search/lib/chip-variants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Slider,
} from '@/modules/design-system';

function toK(value: number) {
  return Math.round(value / 1000);
}

function FeeRangeChip() {
  const t = useTranslations('SchoolSearch');
  const feeMin = useSchoolSearchStore((s) => s.feeMin);
  const feeMax = useSchoolSearchStore((s) => s.feeMax);
  const setFeeRange = useSchoolSearchStore((s) => s.setFeeRange);

  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<[number, number]>([feeMin, feeMax]);

  const isNarrowed = feeMin > FEE_MIN_BOUND || feeMax < FEE_MAX_BOUND;

  const handleOpenChange = (next: boolean) => {
    if (next) setRange([feeMin, feeMax]);
    setOpen(next);
  };

  const handleClear = () => {
    setRange([FEE_MIN_BOUND, FEE_MAX_BOUND]);
    setFeeRange(FEE_MIN_BOUND, FEE_MAX_BOUND);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={cn(chipVariants({ active: isNarrowed }), 'ml-auto')}>
        {t('fee.label')}:{' '}
        {isNarrowed ? t('fee.readout', { min: toK(feeMin), max: toK(feeMax) }) : t('fee.any')}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 transition-transform duration-200 ease-out motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3">
        <p className="text-sm font-medium text-foreground">
          {t('fee.readout', { min: toK(range[0]), max: toK(range[1]) })}
        </p>
        <Slider
          aria-label={t('fee.label')}
          min={FEE_MIN_BOUND}
          max={FEE_MAX_BOUND}
          step={FEE_STEP}
          value={range}
          onValueChange={(value) => {
            if (Array.isArray(value)) setRange([value[0], value[1]]);
          }}
        />
        <div className="flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            {t('fee.clear')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFeeRange(range[0], range[1]);
              setOpen(false);
            }}
          >
            {t('fee.apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { FeeRangeChip };
