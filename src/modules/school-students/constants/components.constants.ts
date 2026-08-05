import type { BadgeProps } from '@/modules/design-system';
import type { AcaraPhase } from '@/modules/school-students/types/constants.types';

export const BACK_CLASSES = 'inline-flex w-fit items-center gap-1.5 text-sm font-medium text-body hover:text-foreground';

// Spec §4 Level column: the four ACARA phases mapped onto the Badge tones the
// design system already ships. No new colour is introduced here.
export const ACARA_PHASE_BADGE_VARIANTS: Record<AcaraPhase, NonNullable<BadgeProps['variant']>> = {
  beginning: 'error',
  emerging: 'warning',
  developing: 'accent',
  consolidating: 'success',
};
