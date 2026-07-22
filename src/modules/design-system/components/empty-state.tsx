import { cn } from '@/lib/utils';

import type {
  EmptyStateProps,
  EmptyStateTone,
} from '@/modules/design-system/types/design-system.types';

// `brand` is the canonical in-panel variant (52px rounded-square medallion on
// soft blue); `muted` keeps the neutral tile the error surfaces already use.
const MEDALLION_TONES: Record<EmptyStateTone, string> = {
  brand: 'size-13 rounded-panel bg-blue-50 text-primary',
  muted: 'size-10 rounded-lg bg-muted text-muted-foreground',
};

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'muted',
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed p-10 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('flex items-center justify-center', MEDALLION_TONES[tone])}
      >
        <Icon className={tone === 'brand' ? 'size-5.5' : 'size-5'} />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
