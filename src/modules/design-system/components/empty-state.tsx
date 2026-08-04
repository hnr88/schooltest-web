import { cn } from '@/lib/utils';
import { MEDALLION_TONES } from '@/modules/design-system/constants/empty-state.constants';

import type { EmptyStateProps } from '@/modules/design-system/types/design-system.types';

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
