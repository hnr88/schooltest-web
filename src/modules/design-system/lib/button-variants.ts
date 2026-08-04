import { cva } from 'class-variance-authority';
import { SIZE_CLASSES, VARIANT_CLASSES } from '@/modules/design-system/constants/button.constants';

import type {
  ButtonSize,
  ButtonVariant,
  ExtendedButtonSize,
  ExtendedButtonVariant,
  ModuleOnlyButtonVariant,
} from '@/modules/design-system/types/button.types';

const extendedButtonVariants = cva('', {
  variants: { variant: VARIANT_CLASSES, size: SIZE_CLASSES },
});

/** Tones the vendored primitive cannot express — it renders them as `default`.
 *  Typed as a predicate so the caller's `else` branch narrows to what it accepts. */
function isExtendedVariant(variant: ButtonVariant): variant is ModuleOnlyButtonVariant {
  return (
    variant === 'navy' || variant === 'accent' || variant === 'white' || variant === 'outline-white'
  );
}

/** The tone override to layer on top of the primitive's own variant, if any. */
function toOverrideVariant(variant: ButtonVariant): ExtendedButtonVariant | undefined {
  return Object.hasOwn(VARIANT_CLASSES, variant)
    ? (variant as ExtendedButtonVariant)
    : undefined;
}

/** The canonical size to draw, if this module owns one for the requested size. */
function toExtendedSize(size: ButtonSize): ExtendedButtonSize | undefined {
  return Object.hasOwn(SIZE_CLASSES, size) ? (size as ExtendedButtonSize) : undefined;
}

export { extendedButtonVariants, isExtendedVariant, toExtendedSize, toOverrideVariant };
