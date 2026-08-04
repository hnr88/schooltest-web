import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';

import type { Badge as BadgePrimitive, badgeVariants } from '@/components/ui/badge';
import type { extendedBadgeVariants } from '@/modules/design-system/lib/badge-variants';

type UiBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
type ExtendedBadgeVariant = NonNullable<VariantProps<typeof extendedBadgeVariants>['variant']>;

export type BadgeVariant = Exclude<UiBadgeVariant, 'destructive'> | ExtendedBadgeVariant;

export interface BadgeProps extends Omit<ComponentProps<typeof BadgePrimitive>, 'variant'> {
  variant?: BadgeVariant;
}
