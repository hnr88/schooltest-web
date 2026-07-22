import { cn } from '@/lib/utils';

import type { EmptyStateHeroProps } from '@/modules/design-system/types/data-display.types';

// Canonical page-level empty state: 96px soft-blue medallion, 27px title, 15px
// lede, centred action — a full surface, not the in-panel EmptyState tile.
function EmptyStateHero({
  icon: Icon,
  title,
  description,
  action,
  footer,
  className,
}: EmptyStateHeroProps) {
  return (
    <div
      data-slot="empty-state-hero"
      className={cn(
        'mx-auto flex w-full max-w-140 animate-in flex-col items-center gap-5 py-10 text-center duration-300 ease-out-expo zoom-in-95 motion-reduce:animate-none',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-24 shrink-0 place-items-center rounded-full bg-blue-50 text-primary"
      >
        <Icon className="size-10" strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-h3 font-bold tracking-tight text-foreground">{title}</p>
        <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap justify-center gap-3">{action}</div> : null}
      {footer}
    </div>
  );
}

export { EmptyStateHero };
