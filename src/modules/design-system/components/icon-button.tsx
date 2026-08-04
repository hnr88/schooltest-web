import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  BASE_CLASSES,
  SIZE_CLASSES,
  TONE_CLASSES,
} from '@/modules/design-system/constants/icon-button.constants';

import type { IconButtonProps } from '@/modules/design-system/types/primitives.types';

// Canonical icon square (Students roster actions 30px / topbar chrome 38px, DS
// §2.4 + §14): a bordered white tile, 8-10px radius, muted 15-17px glyph.
// The VISUAL box stays canonical; the ::after inset — the idiom already proven in
// SidebarNavItem — grows the POINTER target so every icon-only control in the app
// clears the touch-target rule without being drawn bigger.
// Each inset is 1px MORE than the arithmetic 44px minimum, giving 46x46. Sizing the
// pseudo-element to exactly 44 leaves zero tolerance: an element laid out on a
// fractional x/y loses ~1px to device-pixel rounding at the boundary, and a real
// pointer hit test then measures 42-43. The extra pixel per side is what makes the
// target 44 in practice rather than only on paper.
function IconButton({
  icon: Icon,
  label,
  size = 'md',
  tone = 'outline',
  href,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const classes = cn(BASE_CLASSES, SIZE_CLASSES[size], TONE_CLASSES[tone], className);

  if (href !== undefined) {
    return (
      <Link href={href} aria-label={label} data-slot="icon-button" className={classes}>
        <Icon aria-hidden="true" strokeWidth={2} />
      </Link>
    );
  }

  return (
    <button type={type} aria-label={label} data-slot="icon-button" className={classes} {...props}>
      <Icon aria-hidden="true" strokeWidth={2} />
    </button>
  );
}

export { IconButton };
