import {
  STRONG_SCORE,
  WEAK_SCORE,
} from '@/modules/design-system/constants/score-text.constants';

import type { ScoreTextTone } from '@/modules/design-system/types/primitives.types';

export function getScoreTone(value: number | null): ScoreTextTone {
  if (value === null) return 'neutral';
  if (value >= STRONG_SCORE) return 'success';
  if (value >= WEAK_SCORE) return 'warning';
  return 'danger';
}
