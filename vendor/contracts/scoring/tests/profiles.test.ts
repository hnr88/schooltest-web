/**
 * The profile spaces are the binding enumeration (memo §2-§3). Task 02 deletes
 * the API's 24-pattern hierarchy and the R scorer must equal these vectors in
 * this order, so the shape of the constants is itself a contract.
 */
import { describe, expect, it } from 'vitest';

import {
  ATTRIBUTE_NAMES,
  DISPLAY_SKILLS,
  MATRIX_1_ATTRIBUTES,
  MATRIX_1_PROFILES,
  MATRIX_2_ATTRIBUTES,
  MATRIX_2_PROFILES,
  attributeNameSchema,
  bandSchema,
  displaySkillSchema,
  isAdmissibleProfile,
  modelVersionSchema,
} from '../src/index';

describe('profile spaces', () => {
  it('Matrix 1 has the four admissible profiles, each three wide', () => {
    expect(MATRIX_1_PROFILES).toHaveLength(4);
    for (const profile of MATRIX_1_PROFILES) {
      expect(profile).toHaveLength(3);
      expect(profile.every((bit) => bit === 0 || bit === 1)).toBe(true);
    }
    expect(MATRIX_1_PROFILES.map((p) => p.join(''))).toEqual(['000', '100', '110', '111']);
  });

  it('rejects [0, 1, 0] — the linear hierarchy makes it inadmissible', () => {
    expect(isAdmissibleProfile([0, 1, 0], MATRIX_1_PROFILES)).toBe(false);
    expect(isAdmissibleProfile([1, 1, 0], MATRIX_1_PROFILES)).toBe(true);
  });

  it('Matrix 2 has the sixteen saturated profiles, each four wide, binary order', () => {
    expect(MATRIX_2_PROFILES).toHaveLength(16);
    for (const profile of MATRIX_2_PROFILES) {
      expect(profile).toHaveLength(4);
      expect(profile.every((bit) => bit === 0 || bit === 1)).toBe(true);
    }
    expect(MATRIX_2_PROFILES.map((p) => p.join(''))).toEqual(
      Array.from({ length: 16 }, (_, i) => i.toString(2).padStart(4, '0'))
    );
    expect(new Set(MATRIX_2_PROFILES.map((p) => p.join(''))).size).toBe(16);
  });

  it('the matrix attribute lists partition the seven memo attributes in order', () => {
    expect([...MATRIX_1_ATTRIBUTES, ...MATRIX_2_ATTRIBUTES]).toEqual([...ATTRIBUTE_NAMES]);
    expect(ATTRIBUTE_NAMES).toEqual(attributeNameSchema.options);
    expect(MATRIX_1_ATTRIBUTES).toEqual(['Decoding', 'Vocab_A2', 'Grammar']);
    expect(MATRIX_2_ATTRIBUTES).toEqual(['Vocab_B1', 'Gist', 'Detail', 'Inference']);
  });
});

describe('enums', () => {
  it('the seven display skills include Critical and blend Vocabulary', () => {
    expect(DISPLAY_SKILLS).toEqual(displaySkillSchema.options);
    expect(DISPLAY_SKILLS).toEqual([
      'Decoding',
      'Vocabulary',
      'Grammar',
      'Gist',
      'Detail',
      'Inference',
      'Critical',
    ]);
    // The display list is not the model list: no Vocab_A2/Vocab_B1 on screen.
    expect(DISPLAY_SKILLS).not.toContain('Vocab_A2');
    expect(DISPLAY_SKILLS).not.toContain('Vocab_B1');
  });

  it('bands are the four plus the not-assessed sentinel — the v1 enums are gone', () => {
    expect(bandSchema.options).toEqual([
      'secure',
      'developing',
      'emerging',
      'not_yet',
      'not_assessed',
    ]);
    expect(bandSchema.safeParse('mastered').success).toBe(false);
    expect(bandSchema.safeParse('not_mastered').success).toBe(false);
    expect(bandSchema.safeParse('approaching').success).toBe(false);
  });

  it('model versions are the decided reading model, the listening scorer and the isolated legacy tag', () => {
    expect(modelVersionSchema.options).toEqual([
      'reading-3model/1',
      'listening-r7/1',
      'legacy-r7',
    ]);
  });
});
