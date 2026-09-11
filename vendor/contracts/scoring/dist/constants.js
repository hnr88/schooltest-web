"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATRIX_2_WIDTH = exports.MATRIX_1_WIDTH = exports.MATRIX_2_PROFILES = exports.MATRIX_1_PROFILES = exports.MATRIX_2_ATTRIBUTES = exports.MATRIX_1_ATTRIBUTES = exports.DISPLAY_SKILLS = exports.ATTRIBUTE_NAMES = void 0;
exports.isAdmissibleProfile = isAdmissibleProfile;
/** Every model attribute, memo canonical order (Matrix 1 then Matrix 2). */
exports.ATTRIBUTE_NAMES = [
    'Decoding',
    'Vocab_A2',
    'Grammar',
    'Vocab_B1',
    'Gist',
    'Detail',
    'Inference',
];
/** The bars on screen, dashboard §5 canonical order. */
exports.DISPLAY_SKILLS = [
    'Decoding',
    'Vocabulary',
    'Grammar',
    'Gist',
    'Detail',
    'Inference',
    'Critical',
];
/** memo §2 — Matrix 1 (DINA, linear hierarchy Decoding -> Vocab_A2 -> Grammar). */
exports.MATRIX_1_ATTRIBUTES = ['Decoding', 'Vocab_A2', 'Grammar'];
/** memo §3 — Matrix 2 (G-DINA, saturated). */
exports.MATRIX_2_ATTRIBUTES = [
    'Vocab_B1',
    'Gist',
    'Detail',
    'Inference',
];
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
exports.MATRIX_1_PROFILES = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
];
/**
 * memo §3 — the SIXTEEN Matrix 2 profiles, canonical order = binary counting
 * over (Vocab_B1, Gist, Detail, Inference) with Inference as the least
 * significant bit. Saturated: every 4-bit pattern is admissible.
 */
exports.MATRIX_2_PROFILES = [
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
];
/** Q-vector / profile width per matrix — the widths spec v2 §4.2 checks against. */
exports.MATRIX_1_WIDTH = exports.MATRIX_1_ATTRIBUTES.length;
exports.MATRIX_2_WIDTH = exports.MATRIX_2_ATTRIBUTES.length;
/** True when `profile` is one of `admissible`, compared elementwise. */
function isAdmissibleProfile(profile, admissible) {
    return admissible.some((candidate) => candidate.length === profile.length && candidate.every((bit, index) => bit === profile[index]));
}
