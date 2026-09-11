import { cn } from '@/lib/utils';
import { StatusPill } from '@/modules/design-system';
import {
  TONE_CHIP_CLASSES,
  TONE_CHIP_DS_TONE,
  TONE_CHIP_SIZES,
} from '@/modules/teacher/constants/teacher-kit.constants';
import type { ToneChipProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the soft-tint chip every teacher screen draws (status,
 * phase, band, report and live-student chips), restyled from the
 * design-system StatusPill so `data-slot="status-pill"` and `data-tone` stay
 * where the specs look. Tones are the design's exact fg/bg pairs (§8.3).
 */
function ToneChip({ tone, size = 'md', dot = false, children, className }: ToneChipProps) {
  return (
    <StatusPill
      tone={TONE_CHIP_DS_TONE[tone]}
      className={cn(
        'whitespace-nowrap',
        TONE_CHIP_SIZES[size],
        TONE_CHIP_CLASSES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </StatusPill>
  );
}

export { ToneChip };
