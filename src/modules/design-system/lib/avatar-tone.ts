import { TONE_ORDER } from '@/modules/design-system/constants/avatar-tint.constants';

import type { AvatarTintTone } from '@/modules/design-system/types/design-system.types';

export function getAvatarTone(seed: string): AvatarTintTone {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 104729;
  }
  return TONE_ORDER[hash % TONE_ORDER.length] ?? 'blue';
}
