import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';

import type { StatusPillTone } from '@/modules/design-system';
import type {
  ProgressAcaraCardKey,
  ProgressDirection,
  ProgressWatchVariant,
} from '@/modules/teacher/types/class-progress.types';

// NO MASTERY CUT LIVES HERE EITHER — the same discipline
// `constants/mastery.constants.ts` and `src/modules/report/constants/mastery.constants.ts`
// carry. Everything this file tints is the SIGN of a difference the server sent
// (`avg_delta`, `subskill_shift.change`, `delta`); the 80 % / 50 % cuts are
// `Config.teacher_mastery_bands` and were applied server-side before those
// numbers existed. This tab compares nothing to 80 and nothing to 50.
//
// WCAG 2.2 AA 1.4.1: the tone is DECORATION. Every place it is used also prints
// the direction word and the signed number, and the icon below is aria-hidden.
export const PROGRESS_DIRECTION_TONE: Record<ProgressDirection, StatusPillTone> = {
  up: 'success',
  flat: 'neutral',
  down: 'danger',
};

export const PROGRESS_DIRECTION_ICON: Record<ProgressDirection, LucideIcon> = {
  up: ArrowUp,
  flat: Minus,
  down: ArrowDown,
};

/** The direction's own WORD, under `Teacher.results.progress` — always printed. */
export const PROGRESS_DIRECTION_LABEL_KEY: Record<ProgressDirection, string> = {
  up: 'directionUp',
  flat: 'directionFlat',
  down: 'directionDown',
};

/** .qa/DESIGN.md §Progress tab: "Moved up a phase", "Same phase", "Moved down". */
export const PROGRESS_ACARA_CARD_ORDER: readonly ProgressAcaraCardKey[] = ['up', 'same', 'down'];

export const PROGRESS_ACARA_LABEL_KEY: Record<ProgressAcaraCardKey, string> = {
  up: 'acaraUp',
  same: 'acaraSame',
  down: 'acaraDown',
};

/** Tone follows the MOVEMENT the server reported, and the label word says it too. */
export const PROGRESS_ACARA_TONE: Record<ProgressAcaraCardKey, StatusPillTone> = {
  up: 'success',
  same: 'neutral',
  down: 'danger',
};

export const PROGRESS_WATCH_LABEL_KEY: Record<ProgressWatchVariant, string> = {
  most_improved: 'mostImproved',
  needs_attention: 'needsAttention',
};

/**
 * A server-sent EMPTY list is a fact ("no student regressed"), not a missing
 * read — C-TR-4 only fills these arrays from comparable both-tests pairs, so each
 * column states which fact it is instead of rendering nothing.
 */
export const PROGRESS_WATCH_EMPTY_KEY: Record<ProgressWatchVariant, string> = {
  most_improved: 'mostImprovedEmpty',
  needs_attention: 'needsAttentionEmpty',
};

/** The shift table scrolls in its OWN container so the page never scrolls sideways. */
export const PROGRESS_SHIFT_SCROLL_CLASS = 'w-full overflow-x-auto';
