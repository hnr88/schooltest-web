import { cn } from '@/lib/utils';
import {
  DISC_TONES,
  DOT_TONES,
} from '@/modules/design-system/constants/activity-feed-row.constants';

import type {
  ActivityFeedRowProps,
  DotActivityRowProps,
} from '@/modules/design-system/types/record.types';

// Canonical ActivityFeedRow (§02.7 — DS Dashboard components): flex, 11px gap, a
// 30px round tinted icon disc, body 13/1.5 #475569 with the subject in 600 #0E2350,
// timestamp 11.5px with 2px of air above it.
// DotActivityRow (§02.8 — School overview) is the same feed at lower weight: an 8px
// coloured dot instead of the disc. Both live here because choosing between them is
// one decision, and neither is a Card — a feed rendered as cards is the pattern the
// dashboard is being rejected for.
function ActivityFeedRow({
  icon: Icon,
  tone = 'brand',
  children,
  timestamp,
  className,
}: ActivityFeedRowProps) {
  return (
    <div
      data-slot="activity-feed-row"
      className={cn('flex items-start gap-2.75 py-2', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-7.5 shrink-0 place-items-center rounded-full',
          DISC_TONES[tone],
        )}
      >
        <Icon className="size-3.25" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-caption leading-relaxed text-body [&_strong]:font-semibold [&_strong]:text-foreground">
          {children}
        </span>
        <span className="text-overline text-muted-foreground">{timestamp}</span>
      </span>
    </div>
  );
}

function DotActivityRow({ tone = 'brand', children, className }: DotActivityRowProps) {
  return (
    <div data-slot="dot-activity-row" className={cn('flex items-start gap-2.75 py-1.5', className)}>
      <span
        aria-hidden="true"
        className={cn('mt-1.75 size-2 shrink-0 rounded-full', DOT_TONES[tone])}
      />
      <span className="min-w-0 flex-1 text-body-sm text-body [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </span>
    </div>
  );
}

export { ActivityFeedRow, DotActivityRow };
