import { cn } from '@/lib/utils';

import type {
  AvatarTintProps,
  AvatarTintSize,
  AvatarTintTone,
} from '@/modules/design-system/types/design-system.types';

// Initials are real text, so every pair clears 4.5:1 — the canonical teal-600 /
// warning-strong foregrounds sit at 3.3 / 4.5 and axe flags them as serious.
const TONE_CLASSES: Record<AvatarTintTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-warning-soft text-warning-ink',
  sky: 'bg-blue-50 text-primary',
  pink: 'bg-avatar-pink-bg text-avatar-pink-fg',
  violet: 'bg-avatar-violet-bg text-avatar-violet-fg',
};

const SIZE_CLASSES: Record<AvatarTintSize, string> = {
  sm: 'size-8.5 text-meta',
  md: 'size-11 text-body-sm',
  lg: 'size-13 text-h4',
};

const TONE_ORDER: readonly AvatarTintTone[] = ['blue', 'teal', 'violet', 'amber', 'pink', 'sky'];

function getAvatarTone(seed: string): AvatarTintTone {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 104729;
  }
  return TONE_ORDER[hash % TONE_ORDER.length] ?? 'blue';
}

function AvatarTint({ initials, tone = 'blue', size = 'sm', className }: AvatarTintProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="avatar-tint"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export { AvatarTint, getAvatarTone };
