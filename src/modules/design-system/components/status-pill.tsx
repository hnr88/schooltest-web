import { cn } from '@/lib/utils';
import { TONE_CLASSES } from '@/modules/design-system/constants/status-pill.constants';

import type {
  StatusPillProps,
  StatusPillTone,
} from '@/modules/design-system/types/data-display.types';

// Canonical row/hero status pill — 12px/600 title case on a soft tint (the
// design draws "Active", never "ACTIVE"). Distinct
// from Badge (which carries the wider marketing variants).
// Ink (not the 500-level) foregrounds: the canonical pills sit at ~3:1 on their
// soft tints, which axe flags as serious — same hue, AA-safe darkness.
function StatusPill({ tone = 'neutral', children, className }: StatusPillProps) {
  return (
    <span
      data-slot="status-pill"
      data-tone={tone}
      className={cn(
        'inline-flex w-fit items-center rounded-full px-[13px] py-[5px] text-[12px] font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { StatusPill };
