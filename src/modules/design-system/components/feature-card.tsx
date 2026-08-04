import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DESCRIPTION_TONES,
  TILE_TONES,
} from '@/modules/design-system/constants/feature-card.constants';

import type { FeatureCardProps } from '@/modules/design-system/types/design-system.types';

function FeatureCard({
  icon: Icon,
  tone = 'light',
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <Card
      data-slot="feature-card"
      className={cn('h-full', tone === 'navy' && 'bg-navy-900 text-white ring-navy-900', className)}
    >
      <CardContent className="flex flex-col">
        <span
          aria-hidden="true"
          className={cn('flex size-11.5 items-center justify-center rounded-xl', TILE_TONES[tone])}
        >
          <Icon className="size-5" />
        </span>
        <h3 className="mt-4 text-lg font-bold">{title}</h3>
        <p className={cn('mt-2 text-sm leading-relaxed', DESCRIPTION_TONES[tone])}>{description}</p>
      </CardContent>
    </Card>
  );
}

export { FeatureCard };
