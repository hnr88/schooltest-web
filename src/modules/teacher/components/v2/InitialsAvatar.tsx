import { cn } from '@/lib/utils';
import { AvatarTint, getInitials } from '@/modules/design-system';
import { AVATAR_SIZES, AVATAR_TONES } from '@/modules/teacher/constants/teacher-kit.constants';
import type { InitialsAvatarProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the round initials avatar (design-surfaces §8.4): 30 /
 * 34 / 36 / 40 / 56px on #F5F6F8, #EEF1F6, #E8EEFB or navy. Restyled from the
 * design-system AvatarTint (decorative, `aria-hidden`); initials come from
 * `getInitials(name)` unless given.
 */
function InitialsAvatar({ name, initials, size = 'sm', tone = 'grey', className }: InitialsAvatarProps) {
  const text = initials ?? (name === undefined ? '' : getInitials(name));

  return (
    <AvatarTint
      initials={text}
      size="sm"
      className={cn('leading-none', AVATAR_SIZES[size], AVATAR_TONES[tone], className)}
    />
  );
}

export { InitialsAvatar };
