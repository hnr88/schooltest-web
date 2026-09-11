import { cn } from '@/lib/utils';
import {
  CLASS_BADGE_SIZES,
  CLASS_BADGE_TONES,
} from '@/modules/teacher/constants/teacher-kit.constants';
import type { ClassBadgeProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the square class code badge ("7A"): 34px r9 in list
 * rows, 40px r10 on tiles, 56px r10 navy in the class header (`Teacher Portal
 * v2.dc.html:124, 182, 233, 538`). Decorative — the class name sits beside it.
 */
function ClassBadge({ code, size = 'sm', tone = 'neutral', className }: ClassBadgeProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="class-badge"
      className={cn(
        'grid flex-none place-items-center leading-none',
        CLASS_BADGE_SIZES[size],
        CLASS_BADGE_TONES[tone],
        className,
      )}
    >
      {code}
    </span>
  );
}

export { ClassBadge };
