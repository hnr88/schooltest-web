import type {
  ExtendedButtonSize,
  ExtendedButtonVariant,
} from '@/modules/design-system/types/button.types';

export const VARIANT_CLASSES = {
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

// journeys-and-bugs BUG-001 — the design system's canonical sizes, drawn to the
// pixel: sm ≈34px (7px 13px, radius 8), default 40px (10px 18px, radius 10),
// lg ≈46px (13px 26px, radius 12), xl 48px. The `after:` block on sm/default
// remains a POINTER target, not a drawn box.
export const SIZE_CLASSES = {
  sm: 'relative h-[34px] gap-1.5 rounded-[8px] px-[13px] text-[13px] after:absolute after:inset-x-0 after:-inset-y-1.5',
  default:
    'relative h-10 gap-2 rounded-[10px] px-[18px] text-sm after:absolute after:inset-x-0 after:-inset-y-1',
  lg: 'h-[46px] gap-2 rounded-xl px-[26px] text-[15px]',
  xl: 'h-12 gap-2 px-7 rounded-xl text-button',
} satisfies Record<ExtendedButtonSize, string>;
