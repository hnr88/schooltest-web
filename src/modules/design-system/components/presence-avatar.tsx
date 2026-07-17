import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import type {
  PresenceAvatarProps,
  PresenceAvatarSize,
  PresenceStatus,
} from '@/modules/design-system/types/design-system.types';

const SIZE_CLASSES: Record<PresenceAvatarSize, string> = {
  sm: 'size-6',
  default: 'size-8',
  lg: 'size-10',
  xl: 'size-14',
};

const FALLBACK_TEXT_CLASSES: Record<PresenceAvatarSize, string> = {
  sm: 'text-xs',
  default: 'text-sm',
  lg: 'text-sm',
  xl: 'text-lg',
};

const DOT_SIZE_CLASSES: Record<PresenceAvatarSize, string> = {
  sm: 'size-2',
  default: 'size-2.5',
  lg: 'size-3',
  xl: 'size-3.5',
};

const DOT_TONES: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-slate-400',
};

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
            DOT_TONES[presence]
          )}
        />
      ) : null}
    </Avatar>
  );
}

export { PresenceAvatar };
