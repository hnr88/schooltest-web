import type { AssessedBand } from '@schooltest/scoring-contracts';

import type { RosterReleaseState } from '@/modules/results';
import {
  BAND_TONE as KIT_BAND_TONE,
  PHASE_TONE as KIT_PHASE_TONE,
} from '@/modules/teacher/constants/teacher-kit.constants';
import { TONE_CHIP_INK } from '@/modules/teacher/constants/teacher-kit-tones.constants';
import type { BannerTone, ExpectedKind } from '@/modules/teacher/types/v2-family.types';
import type { AcaraPhaseName, GrowthKind, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

// The chip pairs are the kit's (TONE_CHIP_INK), and so is the pair each phase and
// band takes (the kit's PHASE_TONE / BAND_TONE): the view models only read them.
const GREEN = TONE_CHIP_INK.success;
const AMBER = TONE_CHIP_INK.warning;
const AMBER_SOFT = TONE_CHIP_INK.today;
const RED = TONE_CHIP_INK.danger;
const SLATE = TONE_CHIP_INK.slate;
const NAVY = TONE_CHIP_INK.navy;

export const PHASE_TONE: Readonly<Record<AcaraPhaseName, ViewTone>> = {
  Consolidating: TONE_CHIP_INK[KIT_PHASE_TONE.consolidating],
  Developing: TONE_CHIP_INK[KIT_PHASE_TONE.developing],
  Emerging: TONE_CHIP_INK[KIT_PHASE_TONE.emerging],
  Beginning: TONE_CHIP_INK[KIT_PHASE_TONE.beginning],
};

export const NOT_SAT_TONE: ViewTone = RED;

export const BAND_TONE: Readonly<Record<AssessedBand, ViewTone>> = {
  secure: TONE_CHIP_INK[KIT_BAND_TONE.secure],
  developing: TONE_CHIP_INK[KIT_BAND_TONE.developing],
  emerging: TONE_CHIP_INK[KIT_BAND_TONE.emerging],
  not_yet: TONE_CHIP_INK[KIT_BAND_TONE.notYet],
};

export const GATE_TONE: Readonly<Record<'passed' | 'notYet', ViewTone>> = { passed: GREEN, notYet: AMBER };

export const UNASSESSED_TONE: ViewTone = TONE_CHIP_INK.neutral;

export const EXPECTED_TONE: Readonly<Record<ExpectedKind, ViewTone>> = {
  at: NAVY,
  approaching: AMBER,
  below: RED,
};

export const RELEASE_TONE: Readonly<Record<RosterReleaseState, ViewTone>> = {
  released: GREEN,
  held: AMBER_SOFT,
  recalled: RED,
  manual: RED,
  absent: SLATE,
  nosit: SLATE,
  open: NAVY,
};

export const GROWTH_FG: Readonly<Record<GrowthKind, string>> = {
  up: '#1F7A4D',
  down: '#B42318',
  flat: '#5B6472',
  steady: '#9CA3AF',
  none: '#B6BCC7',
};

export const CLASS_FLAG_TONE: Readonly<Record<'focus' | 'strength', ViewTone>> = { focus: RED, strength: GREEN };

export const STUDENT_TAG_TONE: Readonly<Record<'focus' | 'strength', ViewTone>> = { focus: AMBER, strength: GREEN };

export const PROGRESS_TILE_FG = {
  gained: '#1F7A4D',
  held: '#0E2350',
  slipped: '#B42318',
} as const;

export const FAMILY_BANNER_TONE: Readonly<Record<'incomplete' | 'complete', BannerTone>> = {
  incomplete: { fg: '#92610B', bg: '#FDF9EF', border: '#EBD9AE' },
  complete: { fg: '#1F7A4D', bg: '#F2FAF5', border: '#CDE9DA' },
};
