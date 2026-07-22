import { cn } from '@/lib/utils';

import type {
  TimelineRowProps,
  TimelineTagTone,
} from '@/modules/design-system/types/primitives.types';

// DS §5.5 "Result timeline" (Student detail): flex row, 14px gaps, 11px/0 padding
// on a #F1F5F9 hairline that the LAST row drops. Columns are fixed-44px date,
// a categorical subject pill, the flexible title at 14/600, and a trailing slot
// (canonically the score).
// Canonical dates are #94A3B8 — 2.6:1 on white, which axe flags serious — so the
// date takes the same-hue AA-safe slate at 4.9:1.
// Sizes use the default scale because 12px/14px ARE the canonical values here —
// there is no custom --text-* token at either size to prefer.
const TAG_CLASSES: Record<TimelineTagTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-warning-soft text-warning-ink',
  violet: 'bg-avatar-violet-bg text-avatar-violet-fg',
  pink: 'bg-avatar-pink-bg text-avatar-pink-fg',
  neutral: 'bg-muted text-secondary-foreground',
};

function TimelineRow({
  date,
  title,
  tag,
  tagTone = 'blue',
  trailing,
  className,
}: TimelineRowProps) {
  return (
    <div
      data-slot="timeline-row"
      className={cn(
        'flex items-center gap-3.5 border-b border-divider py-2.75 last:border-b-0',
        className,
      )}
    >
      <span className="w-11 shrink-0 text-xs text-muted-foreground">{date}</span>
      {tag ? (
        <span
          data-slot="timeline-tag"
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.75 text-xs font-bold tracking-wide uppercase',
            TAG_CLASSES[tagTone],
          )}
        >
          {tag}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  );
}

export { TimelineRow };
