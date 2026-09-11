/**
 * The profile spaces as MODEL CONSTANTS (spec v2 §0.2, memo §2-§3).
 *
 * These four and sixteen vectors are the binding enumeration. There is no
 * runtime hierarchy code and no computed admissibility check anywhere: task 02
 * deletes the API's 24-pattern enumeration and imports these instead, and the R
 * scorer must equal them profile-for-profile in this order.
 *
 * `import type` only — this module has no runtime dependency on ./enums.
 */
import type { AttributeName, DisplaySkill } from './enums';

/** Every model attribute, memo canonical order (Matrix 1 then Matrix 2). */
export const ATTRIBUTE_NAMES = [
  'Decoding',
  'Vocab_A2',
  'Grammar',
  'Vocab_B1',
  'Gist',
  'Detail',
  'Inference',
] as const satisfies readonly AttributeName[];

/** The bars on screen, dashboard §5 canonical order. */
export const DISPLAY_SKILLS = [
  'Decoding',
  'Vocabulary',
  'Grammar',
  'Gist',
  'Detail',
  'Inference',
  'Critical',
] as const satisfies readonly DisplaySkill[];

/** memo §2 — Matrix 1 (DINA, linear hierarchy Decoding -> Vocab_A2 -> Grammar). */
export const MATRIX_1_ATTRIBUTES = ['Decoding', 'Vocab_A2', 'Grammar'] as const satisfies readonly AttributeName[];

/** memo §3 — Matrix 2 (G-DINA, saturated). */
export const MATRIX_2_ATTRIBUTES = [
  'Vocab_B1',
  'Gist',
  'Detail',
  'Inference',
] as const satisfies readonly AttributeName[];

/** A 0/1 profile vector over one matrix's attributes, in that matrix's order. */
export type ProfileVector = readonly (0 | 1)[];

/**
 * memo §2 — the FOUR admissible Matrix 1 profiles, canonical order. The linear
 * hierarchy makes the other four 3-bit patterns inadmissible: they carry zero
 * prior mass and `[0, 1, 0]` in particular is NOT a member.
 *
 * | # | Decoding | Vocab_A2 | Grammar | label               |
 * | 1 | 0        | 0        | 0       | none                |
 * | 2 | 1        | 0        | 0       | decoding only       |
 * | 3 | 1        | 1        | 0       | decoding + A2 vocab |
 * | 4 | 1        | 1        | 1       | all foundations     |
 */
export const MATRIX_1_PROFILES = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [1, 1, 1],
] as const satisfies readonly ProfileVector[];

/**
 * memo §3 — the SIXTEEN Matrix 2 profiles, canonical order = binary counting
 * over (Vocab_B1, Gist, Detail, Inference) with Inference as the least
 * significant bit. Saturated: every 4-bit pattern is admissible.
 */
export const MATRIX_2_PROFILES = [
  [0, 0, 0, 0],
  [0, 0, 0, 1],
  [0, 0, 1, 0],
  [0, 0, 1, 1],
  [0, 1, 0, 0],
  [0, 1, 0, 1],
  [0, 1, 1, 0],
  [0, 1, 1, 1],
  [1, 0, 0, 0],
  [1, 0, 0, 1],
  [1, 0, 1, 0],
  [1, 0, 1, 1],
  [1, 1, 0, 0],
  [1, 1, 0, 1],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
] as const satisfies readonly ProfileVector[];

/** Q-vector / profile width per matrix — the widths spec v2 §4.2 checks against. */
export const MATRIX_1_WIDTH = MATRIX_1_ATTRIBUTES.length;
export const MATRIX_2_WIDTH = MATRIX_2_ATTRIBUTES.length;

/** True when `profile` is one of `admissible`, compared elementwise. */
export function isAdmissibleProfile(
  profile: readonly number[],
  admissible: readonly ProfileVector[]
): boolean {
  return admissible.some(
    (candidate) =>
      candidate.length === profile.length && candidate.every((bit, index) => bit === profile[index])
  );
}
