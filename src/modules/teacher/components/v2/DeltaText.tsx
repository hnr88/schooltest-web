'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { TrendDelta } from '@/modules/design-system';
import {
  DELTA_COLOURS,
  DELTA_DS_TONE,
  DELTA_SIZES,
} from '@/modules/teacher/constants/teacher-kit.constants';
import { formatDelta } from '@/modules/teacher/lib/teacher-kit';
import type { DeltaTextProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — a server-sent difference spelled the design's way
 * ("↑4" green, "↓2" red, "→0"/"±0" slate, "—" grey; design-surfaces §8.3),
 * on the design-system TrendDelta with its icon off. `data-direction` carries
 * up/down/flat/none for specs.
 */
function DeltaText({ value, format = 'arrow', unit = '', size = 'xs', className }: DeltaTextProps) {
  const t = useTranslations('TeacherPortal.kit');
  const { text, direction } = formatDelta(value, format, unit, t('noValue'));

  return (
    <span data-slot="delta-text" data-direction={direction} className="inline-flex">
      <TrendDelta
        label={text}
        showIcon={false}
        tone={DELTA_DS_TONE[direction]}
        className={cn(
          'gap-0 font-semibold whitespace-nowrap tabular-nums',
          DELTA_SIZES[size],
          DELTA_COLOURS[direction],
          className,
        )}
      />
    </span>
  );
}

export { DeltaText };
