import { cn } from '@/lib/utils';

import { ProgressBar } from '@/modules/design-system/components/progress-bar';
import type {
  SubjectProgressCardProps,
  SubjectProgressTone,
} from '@/modules/design-system/types/primitives.types';

// DS §5.3 "Subject progress" tile (Child profile): white card, #E3E8F0 hairline,
// 14px radius, 18/20 padding, 10px stack. Header row is subject (700 navy) against
// the tone-coloured score, then a 7px #F1F5F9 track with the tone fill, then a
// 12.5px meta line. Canonical meta is #94A3B8 (2.6:1, axe-serious) so it takes the
// AA-safe slate of the same family.
const FILL_CLASSES: Record<SubjectProgressTone, string> = {
  primary: '[&_[data-slot=progress-indicator]]:bg-primary',
  accent: '[&_[data-slot=progress-indicator]]:bg-accent',
  warning: '[&_[data-slot=progress-indicator]]:bg-warning',
  success: '[&_[data-slot=progress-indicator]]:bg-success',
  danger: '[&_[data-slot=progress-indicator]]:bg-destructive',
};

const VALUE_CLASSES: Record<SubjectProgressTone, string> = {
  primary: 'text-primary',
  accent: 'text-teal-600',
  warning: 'text-warning-ink',
  success: 'text-success-ink',
  danger: 'text-danger-ink',
};

function SubjectProgressCard({
  subject,
  value,
  valueLabel,
  progressLabel,
  meta,
  tone = 'primary',
  className,
}: SubjectProgressCardProps) {
  return (
    <article
      data-slot="subject-progress-card"
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border border-border bg-card px-5 py-4.5',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2 text-body-sm">
        <span className="truncate font-bold text-foreground">{subject}</span>
        <span className={cn('shrink-0 font-bold tabular-nums', VALUE_CLASSES[tone])}>
          {valueLabel}
        </span>
      </div>
      <ProgressBar
        value={value}
        ariaLabel={progressLabel}
        className={cn(
          'h-1.75 [&_[data-slot=progress-track]]:h-1.75 [&_[data-slot=progress-track]]:rounded-full',
          FILL_CLASSES[tone],
        )}
      />
      {meta ? <span className="text-meta text-muted-foreground">{meta}</span> : null}
    </article>
  );
}

export { SubjectProgressCard };
