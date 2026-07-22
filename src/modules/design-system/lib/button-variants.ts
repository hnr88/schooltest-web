import { cva } from 'class-variance-authority';

import type {
  ButtonSize,
  ButtonVariant,
  ExtendedButtonSize,
  ExtendedButtonVariant,
  ModuleOnlyButtonVariant,
} from '@/modules/design-system/types/button.types';

const VARIANT_CLASSES = {
  default: 'hover:bg-blue-700',
  navy: 'bg-navy-900 text-white hover:bg-navy-800',
  accent: 'bg-accent text-navy-900 hover:bg-teal-400',
  white: 'bg-white text-navy-900 hover:bg-blue-50',
  'outline-white': 'border-white/40 bg-transparent text-white hover:bg-white/10',
  outline: 'border-input bg-card hover:bg-background',
  secondary: 'hover:bg-blue-100',
  destructive:
    'bg-destructive text-white hover:bg-red-700 dark:bg-destructive dark:hover:bg-red-600',
} satisfies Record<ExtendedButtonVariant, string>;

// The `after:` block on sm/default is a POINTER target, not a drawn box: the
// canonical 32px and 40px pills stay exactly 32 and 40 on screen while a real
// document.elementFromPoint scan resolves 46. The pseudo-element's containing block
// is the PADDING box and the primitive's base carries `border border-transparent`,
// so the inset is measured from 30/38 rather than 32/40 — that is why sm takes 8px
// where default takes 4px. lg (44) and xl (48) already clear the minimum drawn, so
// they get no pseudo at all.
const SIZE_CLASSES = {
  sm: 'relative h-8 gap-1.5 rounded-md px-3.5 text-caption after:absolute after:inset-x-0 after:-inset-y-2',
  default:
    'relative h-10 gap-2 rounded-lg px-4.5 text-sm after:absolute after:inset-x-0 after:-inset-y-1',
  lg: 'h-11 gap-2 rounded-xl px-6.5 text-button',
  xl: 'h-12 gap-2 px-7 rounded-xl text-button',
} satisfies Record<ExtendedButtonSize, string>;

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
