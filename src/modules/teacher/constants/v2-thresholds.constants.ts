import type { AssessedBand, Readiness } from '@schooltest/scoring-contracts';

import type { RosterReleaseState } from '@/modules/results';
import type { ExpectedKind, FamilyFilter } from '@/modules/teacher/types/v2-family.types';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';

export const READINESS_EXPECTED: Readonly<Partial<Record<Readiness, ExpectedKind>>> = {
  met: 'at',
  approaching: 'approaching',
  not_yet: 'below',
};

export const SCORED_RELEASE_KINDS: readonly RosterReleaseState[] = ['held', 'released', 'recalled'];

export const BLOCKED_RELEASE_KINDS: readonly RosterReleaseState[] = ['manual', 'absent', 'nosit'];

export const FILTER_RELEASE_KINDS: Readonly<Record<FamilyFilter, readonly RosterReleaseState[] | null>> = {
  all: null,
  held: ['held'],
  released: ['released'],
  blocked: ['manual', 'absent', 'nosit', 'open'],
};

export const PHASE_ORDER: readonly AcaraPhaseName[] = ['Beginning', 'Emerging', 'Developing', 'Consolidating'];

export const PHASE_SCORE_CUTS: ReadonlyArray<{ phase: AcaraPhaseName; min: number }> = [
  { phase: 'Consolidating', min: 80 },
  { phase: 'Developing', min: 62 },
  { phase: 'Emerging', min: 45 },
];

export const PHASE_SCORE_FLOOR: AcaraPhaseName = 'Beginning';

export const SERVER_PHASE_MAP: Readonly<Partial<Record<string, AcaraPhaseName>>> = {
  beginning: 'Beginning',
  emerging: 'Emerging',
  developing: 'Developing',
  developing_to_consolidating: 'Developing',
  consolidating: 'Consolidating',
};

export const CLASS_MEAN_TONE_CUTS: ReadonlyArray<{ band: AssessedBand; min: number }> = [
  { band: 'secure', min: 78 },
  { band: 'developing', min: 58 },
  { band: 'emerging', min: 45 },
];

export const CLASS_MEAN_TONE_FLOOR: AssessedBand = 'not_yet';

export const BAND_RANK: Readonly<Record<AssessedBand, number>> = {
  not_yet: 0,
  emerging: 1,
  developing: 2,
  secure: 3,
};

export const PROGRESS_TILE_THRESHOLD = 3;

export const COHORT_GROWTH_THRESHOLD = 5;

export const PAIRING_MIN_GAP = 12;

export const PAIRING_MAX_PAIRS = 4;

export const PROGRESS_LIST_SIZE = 3;

export const CARER_LINE_LIMIT = 2;
