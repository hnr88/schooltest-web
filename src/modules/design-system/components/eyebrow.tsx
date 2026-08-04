import { cn } from '@/lib/utils';
import { TONE_CLASSES } from '@/modules/design-system/constants/eyebrow.constants';

import type { EyebrowProps } from '@/modules/design-system/types/design-system.types';

function Eyebrow({ tone = 'blue', children, className }: EyebrowProps) {
  return (
    <p
      data-slot="eyebrow"
      className={cn('text-xs font-bold tracking-eyebrow uppercase', TONE_CLASSES[tone], className)}
    >
      {children}
    </p>
  );
}

export { Eyebrow };
