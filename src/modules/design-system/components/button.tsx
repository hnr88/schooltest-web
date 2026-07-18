import type { ComponentProps, ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button as ButtonPrimitive, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const extendedButtonVariants = cva('', {
  variants: {
    variant: {
      default: 'hover:bg-blue-700',
      navy: 'bg-navy-900 text-white hover:bg-navy-800',
      accent: 'bg-accent text-navy-900 hover:bg-teal-400',
      white: 'bg-white text-navy-900 hover:bg-blue-50',
      'outline-white': 'border-white/40 bg-transparent text-white hover:bg-white/10',
      outline: 'border-input bg-card hover:bg-background',
      secondary: 'hover:bg-blue-100',
      destructive:
        'bg-destructive text-white hover:bg-red-700 dark:bg-destructive dark:hover:bg-red-600',
    },
    size: {
      sm: 'h-8 gap-1.5 rounded-md px-3.5 text-caption',
      default: 'h-10 gap-2 rounded-lg px-4.5 text-sm',
      lg: 'h-11 gap-2 rounded-xl px-6.5 text-button',
      xl: 'h-12 gap-2 px-7 rounded-xl text-button',
    },
  },
});

type UiButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type UiButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
type ExtendedButtonVariant = NonNullable<VariantProps<typeof extendedButtonVariants>['variant']>;

type ButtonVariant = UiButtonVariant | ExtendedButtonVariant;
type ButtonSize = UiButtonSize | 'xl';

const OVERRIDE_VARIANTS: readonly ExtendedButtonVariant[] = [
  'default',
  'navy',
  'accent',
  'white',
  'outline-white',
  'outline',
  'secondary',
  'destructive',
];

interface ButtonProps extends Omit<ComponentProps<typeof ButtonPrimitive>, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  nativeButton,
  render,
  href,
  ...props
}: ButtonProps) {
  const isExtendedVariant =
    variant === 'navy' ||
    variant === 'accent' ||
    variant === 'white' ||
    variant === 'outline-white';
  const cvaVariant = (OVERRIDE_VARIANTS as readonly string[]).includes(variant)
    ? (variant as ExtendedButtonVariant)
    : undefined;
  const cvaSize =
    size === 'sm' || size === 'default' || size === 'lg' || size === 'xl' ? size : undefined;
  const classes = cn(
    extendedButtonVariants({
      variant: cvaVariant,
      size: cvaSize,
    }),
    loading && 'disabled:opacity-85',
    className,
  );
  if (href !== undefined) {
    // Link semantics (D21): forward caller props (aria-*, data-*, target, …) to the anchor.
    // They are plain DOM props at runtime; Base UI's button-generic handler types are nominal.
    const anchorProps = props as ComponentPropsWithoutRef<'a'>;
    return (
      <a
        href={href}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        className={cn(
          buttonVariants({
            variant: isExtendedVariant ? 'default' : variant,
            size: size === 'xl' ? 'default' : size,
          }),
          classes,
        )}
        {...anchorProps}
      >
        {loading ? <Spinner aria-hidden="true" /> : null}
        {children}
      </a>
    );
  }
  return (
    <ButtonPrimitive
      variant={isExtendedVariant ? 'default' : variant}
      size={size === 'xl' ? 'default' : size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      render={render}
      nativeButton={nativeButton ?? (render !== undefined ? false : undefined)}
      className={classes}
      {...props}
    >
      {loading ? <Spinner aria-hidden="true" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, type ButtonProps };
