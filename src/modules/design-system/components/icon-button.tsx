import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type {
  IconButtonProps,
  IconButtonSize,
  IconButtonTone,
} from '@/modules/design-system/types/primitives.types';

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
const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'size-7.5 rounded-md after:-inset-2 [&_svg]:size-3.5',
  md: 'size-8 rounded-md after:-inset-1.75 [&_svg]:size-3.75',
  lg: 'size-9.5 rounded-lg after:-inset-1 [&_svg]:size-4.25',
};

const TONE_CLASSES: Record<IconButtonTone, string> = {
  outline:
    'border border-border bg-card text-sidebar-foreground hover:bg-muted hover:text-foreground',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  soft: 'bg-blue-50 text-secondary-foreground hover:bg-blue-100',
  danger: 'text-danger-strong hover:bg-danger-soft hover:text-danger-ink',
};

const BASE_CLASSES =
  'relative inline-grid shrink-0 place-items-center transition-colors duration-200 ease-out after:absolute focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none';

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
