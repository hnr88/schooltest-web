import { cn } from '@/lib/utils';

import type {
  StatusPillProps,
  StatusPillTone,
} from '@/modules/design-system/types/data-display.types';

// Canonical row/hero status pill — 12px/700 uppercase on a soft tint. Distinct
// from Badge (which carries the wider marketing variants).
// Ink (not the 500-level) foregrounds: the canonical pills sit at ~3:1 on their
// soft tints, which axe flags as serious — same hue, AA-safe darkness.
const TONE_CLASSES: Record<StatusPillTone, string> = {
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-blue-50 text-secondary-foreground',
  neutral: 'bg-muted text-secondary-foreground',
};

function StatusPill({ tone = 'neutral', children, className }: StatusPillProps) {
  return (
    <span
      data-slot="status-pill"
      data-tone={tone}
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-meta font-bold tracking-wide uppercase',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { StatusPill };
