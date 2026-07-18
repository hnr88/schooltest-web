import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Badge as BadgePrimitive, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const extendedBadgeVariants = cva('', {
  variants: {
    variant: {
      navy: 'bg-navy-900 text-white',
      accent: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    },
  },
});

type UiBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
type ExtendedBadgeVariant = NonNullable<VariantProps<typeof extendedBadgeVariants>['variant']>;

type BadgeVariant = Exclude<UiBadgeVariant, 'destructive'> | ExtendedBadgeVariant;

interface BadgeProps extends Omit<ComponentProps<typeof BadgePrimitive>, 'variant'> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const isExtendedVariant =
    variant === 'navy' ||
    variant === 'accent' ||
    variant === 'success' ||
    variant === 'warning' ||
    variant === 'error';
  return (
    <BadgePrimitive
      variant={isExtendedVariant ? 'default' : variant}
      className={cn(
        extendedBadgeVariants({ variant: isExtendedVariant ? variant : undefined }),
        className,
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps };
