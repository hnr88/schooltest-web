import type { ProgressBarTone } from '@/modules/design-system/types/design-system.types';

export const TONE_CLASSES: Record<ProgressBarTone, string> = {
  solid: '',
  gradient:
    '[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-blue-600 [&_[data-slot=progress-indicator]]:to-teal-500',
};
