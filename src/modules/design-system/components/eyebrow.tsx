import { cn } from '@/lib/utils';

import type { EyebrowProps } from '../types/design-system.types';

const TONE_CLASSES: Record<NonNullable<EyebrowProps['tone']>, string> = {
  blue: 'text-blue-600',
  teal: 'text-teal-600',
};

function Eyebrow({ tone = 'blue', children, className }: EyebrowProps) {
  return (
    <p
      data-slot="eyebrow"
      className={cn('text-xs font-bold uppercase tracking-[0.1em]', TONE_CLASSES[tone], className)}
    >
      {children}
    </p>
  );
}

export { Eyebrow };
