import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button as ButtonPrimitive, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const extendedButtonVariants = cva('', {
  variants: {
    variant: {
      navy: 'bg-navy-900 text-white hover:bg-navy-800',
      accent: 'bg-accent text-accent-foreground hover:bg-teal-600',
      white: 'bg-white text-navy-900 hover:bg-blue-50',
      'outline-white': 'border-white/40 bg-transparent text-white hover:bg-white/10',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-red-700 dark:bg-destructive dark:hover:bg-red-600',
    },
    size: {
      xl: 'h-12 px-7 rounded-xl text-[15px]',
    },
  },
});

type UiButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type UiButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
type ExtendedButtonVariant = NonNullable<
  VariantProps<typeof extendedButtonVariants>['variant']
>;

type ButtonVariant = UiButtonVariant | ExtendedButtonVariant;
type ButtonSize = UiButtonSize | 'xl';

interface ButtonProps extends Omit<ComponentProps<typeof ButtonPrimitive>, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isExtendedVariant =
    variant === 'navy' || variant === 'accent' || variant === 'white' || variant === 'outline-white';
  const cvaVariant = isExtendedVariant || variant === 'destructive' ? variant : undefined;
  return (
    <ButtonPrimitive
      variant={isExtendedVariant ? 'default' : variant}
      size={size === 'xl' ? 'default' : size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        extendedButtonVariants({
          variant: cvaVariant,
          size: size === 'xl' ? 'xl' : undefined,
        }),
        className
      )}
      {...props}
    >
      {loading ? <Spinner aria-hidden="true" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, type ButtonProps };
