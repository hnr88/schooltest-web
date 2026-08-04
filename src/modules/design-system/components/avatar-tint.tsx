import { cn } from '@/lib/utils';
import {
  SIZE_CLASSES,
  TONE_CLASSES,
} from '@/modules/design-system/constants/avatar-tint.constants';

import type { AvatarTintProps } from '@/modules/design-system/types/design-system.types';

function AvatarTint({ initials, tone = 'blue', size = 'sm', className }: AvatarTintProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="avatar-tint"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export { AvatarTint };
