import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';

import type { Button as ButtonPrimitive, buttonVariants } from '@/components/ui/button';

type UiButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type UiButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

/** Tones this module adds to, or restyles on top of, the vendored primitive. */
export type ExtendedButtonVariant =
  | 'default'
  | 'navy'
  | 'accent'
  | 'white'
  | 'outline-white'
  | 'outline'
  | 'secondary'
  | 'destructive';

/** Tones with no primitive equivalent at all — they render there as `default`. */
export type ModuleOnlyButtonVariant = 'navy' | 'accent' | 'white' | 'outline-white';

/** The canonical DS size scale — the primitive's own scale is not canonical here. */
export type ExtendedButtonSize = 'sm' | 'default' | 'lg' | 'xl';

export type ButtonVariant = UiButtonVariant | ExtendedButtonVariant;
export type ButtonSize = UiButtonSize | 'xl';

export interface ButtonProps
  extends Omit<ComponentProps<typeof ButtonPrimitive>, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
}
