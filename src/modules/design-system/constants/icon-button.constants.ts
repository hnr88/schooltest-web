import type {
  IconButtonSize,
  IconButtonTone,
} from '@/modules/design-system/types/primitives.types';

// journeys-and-bugs BUG-001 — canonical icon square per the design system:
// sm 32px / radius 8, md 38×38 / radius 10, lg 44px / radius 12. The ::after
// inset keeps growing the POINTER target beyond the drawn box.
export const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'size-8 rounded-[8px] after:-inset-1.5 [&_svg]:size-3.5',
  md: 'size-[38px] rounded-[10px] after:-inset-[3px] [&_svg]:size-[17px]',
  lg: 'size-11 rounded-xl after:-inset-0.5 [&_svg]:size-[19px]',
};

export const TONE_CLASSES: Record<IconButtonTone, string> = {
  outline:
    'border border-border bg-card text-sidebar-foreground hover:bg-muted hover:text-foreground',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  soft: 'bg-blue-50 text-secondary-foreground hover:bg-blue-100',
  danger: 'text-danger-strong hover:bg-danger-soft hover:text-danger-ink',
};

export const BASE_CLASSES =
  'relative inline-grid shrink-0 place-items-center transition-colors duration-200 ease-out after:absolute focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none';
