import { cn } from '@/lib/utils';

import type {
  InsightCalloutProps,
  InsightCalloutTone,
} from '@/modules/design-system/types/design-system.types';

const TONE_CLASSES: Record<InsightCalloutTone, string> = {
  info: 'bg-blue-50 text-secondary-foreground',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
};

const ICON_CLASSES: Record<InsightCalloutTone, string> = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

// Trailing-pill slot. Canonical DELIBERATELY contrasts the pill against the strip
// — the Parent-overview info strip (#EFF5FF) carries an amber UPCOMING pill
// (#D97706 on #FEF3C7) — because a pill drawn in the strip's own tint is an
// INVISIBLE pill: same fill, same ink, no shape. A StatusPill whose tone MATCHES
// the strip is therefore re-tinted here to the canonical contrasting family; a
// pill that already differs from its strip is left untouched. The pill's WORDS
// carry the meaning; the tint only has to separate it from the strip.
const ACTION_PILL_CLASSES: Record<InsightCalloutTone, string> = {
  info: '[&_[data-slot=status-pill][data-tone=info]]:bg-warning-soft [&_[data-slot=status-pill][data-tone=info]]:text-warning-ink',
  success:
    '[&_[data-slot=status-pill][data-tone=success]]:bg-blue-100 [&_[data-slot=status-pill][data-tone=success]]:text-blue-700',
  warning:
    '[&_[data-slot=status-pill][data-tone=warning]]:bg-blue-100 [&_[data-slot=status-pill][data-tone=warning]]:text-blue-700',
  danger:
    '[&_[data-slot=status-pill][data-tone=danger]]:bg-warning-soft [&_[data-slot=status-pill][data-tone=danger]]:text-warning-ink',
};

function InsightCallout({
  icon: Icon,
  tone = 'info',
  children,
  action,
  className,
}: InsightCalloutProps) {
  return (
    <div
      data-slot="insight-callout"
      data-tone={tone}
      className={cn(
        'flex items-center gap-2.5 rounded-tile px-3.5 py-3 text-body-sm',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('size-4 shrink-0', ICON_CLASSES[tone])} />
      <span className="min-w-0 flex-1">{children}</span>
      {action ? (
        <span
          data-slot="insight-callout-action"
          className={cn('shrink-0', ACTION_PILL_CLASSES[tone])}
        >
          {action}
        </span>
      ) : null}
    </div>
  );
}

export { InsightCallout };
