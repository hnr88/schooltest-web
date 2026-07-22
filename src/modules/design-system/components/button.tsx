import type { ComponentPropsWithoutRef } from 'react';

import { Button as ButtonPrimitive, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  extendedButtonVariants,
  isExtendedVariant,
  toExtendedSize,
  toOverrideVariant,
} from '@/modules/design-system/lib/button-variants';
import type { ButtonProps } from '@/modules/design-system/types/button.types';

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
  const classes = cn(
    extendedButtonVariants({
      variant: toOverrideVariant(variant),
      size: toExtendedSize(size),
    }),
    loading && 'disabled:opacity-85',
    className,
  );
  if (href !== undefined) {
    // Link semantics (D21): forward caller props (aria-*, data-*, target, …) to the anchor.
    // They are plain DOM props at runtime; Base UI's button-generic handler types are nominal.
    const anchorProps = props as ComponentPropsWithoutRef<'a'>;
    return (
      <Link
        href={href}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        className={cn(
          buttonVariants({
            variant: isExtendedVariant(variant) ? 'default' : variant,
            size: size === 'xl' ? 'default' : size,
          }),
          classes,
        )}
        {...anchorProps}
      >
        {loading ? <Spinner aria-hidden="true" /> : null}
        {children}
      </Link>
    );
  }
  return (
    <ButtonPrimitive
      variant={isExtendedVariant(variant) ? 'default' : variant}
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

export { Button };
export type { ButtonProps };
