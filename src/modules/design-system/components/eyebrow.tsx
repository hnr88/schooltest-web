import { cn } from '@/lib/utils';

import type { EyebrowProps } from '@/modules/design-system/types/design-system.types';

const TONE_CLASSES: Record<NonNullable<EyebrowProps['tone']>, string> = {
  blue: 'text-blue-600',
  teal: 'text-teal-700',
};

function Eyebrow({ tone = 'blue', children, className }: EyebrowProps) {
  return (
    <p
      data-slot="eyebrow"
      className={cn('text-xs font-bold tracking-[0.1em] uppercase', TONE_CLASSES[tone], className)}
    >
      {children}
    </p>
  );
}

export { Eyebrow };
