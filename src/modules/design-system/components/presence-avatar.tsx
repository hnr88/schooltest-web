import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DOT_SIZE_CLASSES,
  DOT_TONES,
  FALLBACK_TEXT_CLASSES,
  SIZE_CLASSES,
} from '@/modules/design-system/constants/presence-avatar.constants';

import type { PresenceAvatarProps } from '@/modules/design-system/types/design-system.types';

function PresenceAvatar({ initials, size = 'default', presence, className }: PresenceAvatarProps) {
  return (
    <Avatar data-slot="presence-avatar" className={cn(SIZE_CLASSES[size], className)}>
      <AvatarFallback
        className={cn('bg-blue-100 font-bold text-navy-900', FALLBACK_TEXT_CLASSES[size])}
      >
        {initials}
      </AvatarFallback>
      {presence ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-0 bottom-0 z-10 rounded-full ring-2 ring-background',
            DOT_SIZE_CLASSES[size],
            DOT_TONES[presence],
          )}
        />
      ) : null}
    </Avatar>
  );
}

export { PresenceAvatar };
