import type { AssessedBand } from '@schooltest/scoring-contracts';

import type { RosterReleaseState } from '@/modules/results';
import type { BannerTone, ExpectedKind } from '@/modules/teacher/types/v2-family.types';
import type { AcaraPhaseName, GrowthKind, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

const GREEN: ViewTone = { fg: '#1F7A4D', bg: '#E9F6EF' };
const BLUE: ViewTone = { fg: '#1A3B8B', bg: '#EAF0FB' };
const AMBER: ViewTone = { fg: '#92610B', bg: '#FDF4E3' };
const AMBER_SOFT: ViewTone = { fg: '#92610B', bg: '#FDF3E0' };
const RED: ViewTone = { fg: '#B42318', bg: '#FDEEEC' };
const SLATE: ViewTone = { fg: '#5A6478', bg: '#EEF1F6' };
const NAVY: ViewTone = { fg: '#0E2350', bg: '#EEF1F6' };

export const PHASE_TONE: Readonly<Record<AcaraPhaseName, ViewTone>> = {
  Consolidating: GREEN,
  Developing: BLUE,
  Emerging: AMBER,
  Beginning: RED,
};

export const NOT_SAT_TONE: ViewTone = RED;

export const BAND_TONE: Readonly<Record<AssessedBand, ViewTone>> = {
  secure: GREEN,
  developing: BLUE,
  emerging: AMBER,
  not_yet: RED,
};

export const GATE_TONE: Readonly<Record<'passed' | 'notYet', ViewTone>> = { passed: GREEN, notYet: AMBER };

export const UNASSESSED_TONE: ViewTone = { fg: '#5B6472', bg: '#F1F3F6' };

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
