import type { EyebrowProps } from '@/modules/design-system/types/design-system.types';

export const TONE_CLASSES: Record<NonNullable<EyebrowProps['tone']>, string> = {
  blue: 'text-blue-600 dark:text-blue-300',
  teal: 'text-teal-700 dark:text-teal-300',
};
