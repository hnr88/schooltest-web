import type {
  PresenceAvatarSize,
  PresenceStatus,
} from '@/modules/design-system/types/design-system.types';

export const SIZE_CLASSES: Record<PresenceAvatarSize, string> = {
  sm: 'size-6',
  default: 'size-8',
  lg: 'size-10',
  xl: 'size-14',
};

export const FALLBACK_TEXT_CLASSES: Record<PresenceAvatarSize, string> = {
  sm: 'text-xs',
  default: 'text-sm',
  lg: 'text-sm',
  xl: 'text-lg',
};

export const DOT_SIZE_CLASSES: Record<PresenceAvatarSize, string> = {
  sm: 'size-2',
  default: 'size-2.5',
  lg: 'size-3',
  xl: 'size-3.5',
};

export const DOT_TONES: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-slate-400',
};
