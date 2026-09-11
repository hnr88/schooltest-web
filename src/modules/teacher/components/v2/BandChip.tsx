'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { BAND_TONE } from '@/modules/teacher/constants/teacher-kit.constants';
import type { BandChipProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the subskill band chip (subBand, design l.1975): Secure
 * green · Developing blue · Emerging amber · Not yet red, 11–11.5px/600. The
 * band is the server's (normalise it with `bandKey`).
 */
function BandChip({ band, label, size = 'sm', className }: BandChipProps) {
  const t = useTranslations('TeacherPortal.kit.band');

  return (
    <ToneChip tone={BAND_TONE[band]} size="sm" className={cn(size === 'sm' && 'text-[11px]', className)}>
      {label ?? t(band)}
    </ToneChip>
  );
}

export { BandChip };
