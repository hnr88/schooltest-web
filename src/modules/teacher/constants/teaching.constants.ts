import type { AssessedBand } from '@schooltest/scoring-contracts';

import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';
import type { NextPhase, TeachingSkill, TeachingStrand } from '@/modules/teacher/types/teaching-plan.types';

export const TEACHING_STRANDS: Readonly<Record<TeachingStrand, readonly TeachingSkill[]>> = {
  vocabulary: ['Vocab_A2', 'Vocab_B1', 'Vocab_B2'],
  comprehension: ['Gist', 'Detail', 'Inference'],
  foundations: ['Decoding', 'Grammar'],
};

export const NEXT_PHASE: Readonly<Record<AcaraPhaseName, NextPhase>> = {
  Beginning: 'Emerging',
  Emerging: 'Developing',
  Developing: 'Consolidating',
  Consolidating: 'Extend',
};

export const TEACHING_PROMPT_SKILL: Readonly<Record<TeachingSkill, string>> = {
  Vocab_A2: 'Everyday vocabulary',
  Vocab_B1: 'Classroom vocabulary',
  Vocab_B2: 'Academic vocabulary',
  Gist: 'Gist',
  Detail: 'Detail',
  Inference: 'Inference',
  Decoding: 'Decoding',
  Grammar: 'Grammar',
};

/**
 * The 04-Teaching mock draws a phase-coloured letter badge with a soft border in
 * the same hue family (`TONE_CHIP_INK` carries only fg/bg, so the borders live here):
 * Beginning red, Emerging amber, Developing blue, Consolidating green.
 */
export const PHASE_BORDER: Readonly<Record<AcaraPhaseName, string>> = {
  Beginning: '#F6CFC9',
  Emerging: '#F0DCA8',
  Developing: '#CFDBF2',
  Consolidating: '#CDE9DA',
};

/** The same border family for the next-step pills, keyed by the SERVER band (`BAND_TONE`'s pair). */
export const BAND_BORDER: Readonly<Record<AssessedBand, string>> = {
  not_yet: '#F6CFC9',
  emerging: '#F0DCA8',
  developing: '#CFDBF2',
  secure: '#CDE9DA',
};

/** The mock's overlapping member avatars cycle this light→navy ramp (index order). */
export const TEACHING_AVATAR_LIMIT = 4;

export const TEACHING_AVATARS: readonly (readonly [bg: string, fg: string])[] = [
  ['#DCE6F6', '#0E2350'],
  ['#A9C4EE', '#0E2350'],
  ['#4169B5', '#FFFFFF'],
  ['#2C4C97', '#FFFFFF'],
];
