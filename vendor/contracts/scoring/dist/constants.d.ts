/** Every model attribute, memo canonical order (Matrix 1 then Matrix 2). */
export declare const ATTRIBUTE_NAMES: readonly ["Decoding", "Vocab_A2", "Grammar", "Vocab_B1", "Gist", "Detail", "Inference"];
/** The bars on screen, dashboard §5 canonical order. */
export declare const DISPLAY_SKILLS: readonly ["Decoding", "Vocabulary", "Grammar", "Gist", "Detail", "Inference", "Critical"];
/** memo §2 — Matrix 1 (DINA, linear hierarchy Decoding -> Vocab_A2 -> Grammar). */
export declare const MATRIX_1_ATTRIBUTES: readonly ["Decoding", "Vocab_A2", "Grammar"];
/** memo §3 — Matrix 2 (G-DINA, saturated). */
export declare const MATRIX_2_ATTRIBUTES: readonly ["Vocab_B1", "Gist", "Detail", "Inference"];
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
export declare const MATRIX_1_PROFILES: readonly [readonly [0, 0, 0], readonly [1, 0, 0], readonly [1, 1, 0], readonly [1, 1, 1]];
/**
 * memo §3 — the SIXTEEN Matrix 2 profiles, canonical order = binary counting
 * over (Vocab_B1, Gist, Detail, Inference) with Inference as the least
 * significant bit. Saturated: every 4-bit pattern is admissible.
 */
export declare const MATRIX_2_PROFILES: readonly [readonly [0, 0, 0, 0], readonly [0, 0, 0, 1], readonly [0, 0, 1, 0], readonly [0, 0, 1, 1], readonly [0, 1, 0, 0], readonly [0, 1, 0, 1], readonly [0, 1, 1, 0], readonly [0, 1, 1, 1], readonly [1, 0, 0, 0], readonly [1, 0, 0, 1], readonly [1, 0, 1, 0], readonly [1, 0, 1, 1], readonly [1, 1, 0, 0], readonly [1, 1, 0, 1], readonly [1, 1, 1, 0], readonly [1, 1, 1, 1]];
/** Q-vector / profile width per matrix — the widths spec v2 §4.2 checks against. */
export declare const MATRIX_1_WIDTH: 3;
export declare const MATRIX_2_WIDTH: 4;
/** True when `profile` is one of `admissible`, compared elementwise. */
export declare function isAdmissibleProfile(profile: readonly number[], admissible: readonly ProfileVector[]): boolean;
