import { Badge as BadgePrimitive } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { extendedBadgeVariants } from '@/modules/design-system/lib/badge-variants';

import type { BadgeProps } from '@/modules/design-system/types/badge.types';

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

export { Badge };
