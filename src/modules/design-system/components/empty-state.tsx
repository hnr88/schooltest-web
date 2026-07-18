import { cn } from '@/lib/utils';

import type { EmptyStateProps } from '@/modules/design-system/types/design-system.types';

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
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
        className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
