import type { ToneChipTone } from '@/modules/teacher/types/teacher-kit.types';
import type { ViewTone } from '@/modules/teacher/types/v2-view-common.types';

/**
 * Teacher Portal v2 kit — each chip tone's fg / bg pair as values (design-surfaces
 * §8.3), the ONE source the view models' inline colours read
 * (`v2-tones.constants.ts`). `TONE_CHIP_CLASSES` draws the same pairs as literal
 * Tailwind classes, which Tailwind must see in the source; teacher-kit.test pins
 * the two together. `navy` ink is the `navy-900` token.
 */
export const TONE_CHIP_INK: Readonly<Record<ToneChipTone, ViewTone>> = {
  success: { fg: '#1F7A4D', bg: '#E9F6EF' },
  info: { fg: '#1A3B8B', bg: '#EAF0FB' },
  warning: { fg: '#92610B', bg: '#FDF4E3' },
  scheduled: { fg: '#8A5A00', bg: '#FDF4E3' },
  today: { fg: '#92610B', bg: '#FDF3E0' },
  danger: { fg: '#B42318', bg: '#FDEEEC' },
  navy: { fg: '#0E2350', bg: '#EEF1F6' },
  neutral: { fg: '#5B6472', bg: '#F1F3F6' },
  slate: { fg: '#5A6478', bg: '#EEF1F6' },
};
