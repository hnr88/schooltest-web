import type { AssessedBand } from '@schooltest/scoring-contracts';

import type { BandKey, ToneChipTone } from '@/modules/teacher/types/teacher-kit.types';
import type { SubskillTagKind } from '@/modules/teacher/types/v2-student-detail.types';

/** Every student-page string lives here (`TeacherPortal.student`); labels come from `TeacherPortal.viewModel`. */
export const STUDENT_I18N_NAMESPACE = 'TeacherPortal.student';

type SignedKeys = Readonly<Record<'up' | 'down' | 'flat', string>>;

/** The navy "Overall reading" chip: "↑ +8 pts" / "↓ −45 pts" / "→ ±0 pts". */
export const OVERALL_DELTA_KEY: SignedKeys = {
  up: 'overallDelta.up',
  down: 'overallDelta.down',
  flat: 'overallDelta.flat',
};

/** The Growth tile: "+8 pts" / "−45 pts" / "±0 pts". */
export const GROWTH_TILE_KEY: SignedKeys = {
  up: 'tiles.growthUp',
  down: 'tiles.growthDown',
  flat: 'tiles.growthFlat',
};

/** A subskill card's movement beside its bar: "↑ +7" / "↓ −9" / "±0". */
export const SUBSKILL_DELTA_KEY: SignedKeys = {
  up: 'subskills.deltaUp',
  down: 'subskills.deltaDown',
  flat: 'subskills.deltaFlat',
};

/** The analysis growth sentence — "reliable" only when the server flags the change reliable. */
export const ANALYSIS_GROWTH_KEY = {
  up: { reliable: 'analysis.growthUpReliable', plain: 'analysis.growthUp' },
  down: { reliable: 'analysis.growthDownReliable', plain: 'analysis.growthDown' },
  flat: 'analysis.growthFlat',
  steady: 'analysis.growthSteady',
} as const;

/** The student chart's strokes and text (`Teacher Portal v2.dc.html:404–425`, design-surfaces §7.1). */
export const STUDENT_CHART_STYLE = {
  grid: '#EDEFF3',
  axis: '#94A0B2',
  line: '#0E2350',
  phaseLabel: '#5B6472',
  xLabel: '#4B5563',
  xSub: '#B6BCC7',
  pointFill: '#FFFFFF',
  axisTopY: 12,
} as const;

/** The kit BandChip for each server band; its tone pairs are the view model's `BAND_TONE`. */
export const STUDENT_BAND_CHIP: Readonly<Record<AssessedBand, BandKey>> = {
  secure: 'secure',
  developing: 'developing',
  emerging: 'emerging',
  not_yet: 'notYet',
};

/** Strength green · Focus area amber (`studentVals` tagFg/tagBg). */
export const STUDENT_TAG_CHIP_TONE: Readonly<Record<SubskillTagKind, ToneChipTone>> = {
  strength: 'success',
  focus: 'warning',
};

/** The Critical reading card's exit gate chip, in place of a band. */
export const STUDENT_GATE_CHIP_TONE: Readonly<Record<'passed' | 'notYet', ToneChipTone>> = {
  passed: 'success',
  notYet: 'warning',
};

/** The header's 38px Export and Ask AI buttons: 13px/600, 15px side padding. */
export const STUDENT_HEADER_BUTTON_CLASS = 'px-[15px] text-[13px] font-semibold';
