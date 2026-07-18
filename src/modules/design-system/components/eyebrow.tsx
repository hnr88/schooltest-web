import { cn } from '@/lib/utils';

import type { EyebrowProps } from '@/modules/design-system/types/design-system.types';

const TONE_CLASSES: Record<NonNullable<EyebrowProps['tone']>, string> = {
  blue: 'text-blue-600 dark:text-blue-300',
  teal: 'text-teal-700 dark:text-teal-300',
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
