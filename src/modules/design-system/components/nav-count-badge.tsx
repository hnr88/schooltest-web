import { cn } from '@/lib/utils';

import type { NavCountBadgeProps } from '@/modules/design-system/types/design-system.types';

// Canonical in-nav count pill (DS §12 Navigation card): soft blue-50/blue-600,
// min-w 20 / h 20, radius-full, 11.5px/700 — deliberately NOT the red CountBadge,
// which is the unread-notification idiom.
function NavCountBadge({ count, className }: NavCountBadgeProps) {
  return (
    <span
      data-slot="nav-count-badge"
      aria-hidden="true"
      className={cn(
        'inline-grid h-5 min-w-5 place-items-center rounded-full bg-blue-50 px-1.5 text-overline font-bold text-blue-600',
        className,
      )}
    >
      {count}
    </span>
  );
}

export { NavCountBadge };
