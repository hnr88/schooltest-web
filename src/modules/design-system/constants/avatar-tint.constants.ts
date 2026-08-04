import type {
  AvatarTintSize,
  AvatarTintTone,
} from '@/modules/design-system/types/design-system.types';

// Initials are real text, so every pair clears 4.5:1 — the canonical teal-600 /
// warning-strong foregrounds sit at 3.3 / 4.5 and axe flags them as serious.
export const TONE_CLASSES: Record<AvatarTintTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-warning-soft text-warning-ink',
  sky: 'bg-blue-50 text-primary',
  pink: 'bg-avatar-pink-bg text-avatar-pink-fg',
  violet: 'bg-avatar-violet-bg text-avatar-violet-fg',
};

export const SIZE_CLASSES: Record<AvatarTintSize, string> = {
  sm: 'size-8.5 text-meta',
  md: 'size-11 text-body-sm',
  lg: 'size-13 text-h4',
};

export const TONE_ORDER: readonly AvatarTintTone[] = [
  'blue',
  'teal',
  'violet',
  'amber',
  'pink',
  'sky',
];
