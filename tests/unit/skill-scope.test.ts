import { describe, expect, test } from 'vitest';

import {
  DEFAULT_RESULTS_TAB,
  RESULTS_TAB_ORDER,
} from '@/modules/teacher/constants/results.constants';
import {
  DEFAULT_SKILL_SCOPE,
  SKILL_SCOPE_ORDER,
  isSkillLive,
  isSkillScopeValue,
} from '@/modules/teacher/lib/skill-scope';

/**
 * teacher/07 — the widened results shell. The tab ORDER is the design export's
 * own (`Teacher Portal v2.dc.html` `:3154–3166`): the four existing values keep
 * their names ([D-05] — the design's `v:'results'` is NOT adopted), progress and
 * insights swap, and `reports` + `live` join as tab VALUES, not routes ([D-20]).
 * The skill scope is the one place the four skills and the reading gate live.
 */
describe('RESULTS_TAB_ORDER (task 07 widening)', () => {
  test('carries the six design tabs in label order, no member lost', () => {
    expect(RESULTS_TAB_ORDER).toEqual([
      'students',
      'progress',
      'insights',
      'exit',
      'reports',
      'live',
    ]);
  });

  test('the default tab is unchanged and stays a member of the widened set', () => {
    expect(DEFAULT_RESULTS_TAB).toBe('students');
    expect(RESULTS_TAB_ORDER).toContain(DEFAULT_RESULTS_TAB);
  });
});

describe('skill scope (task 07 — one truth, two presentations)', () => {
  test('the four skills in the design chip order, reading first', () => {
    expect(SKILL_SCOPE_ORDER).toEqual(['reading', 'listening', 'writing', 'speaking']);
  });

  test('reading is the default and the only live skill', () => {
    expect(DEFAULT_SKILL_SCOPE).toBe('reading');
    for (const skill of SKILL_SCOPE_ORDER) {
      expect(isSkillLive(skill)).toBe(skill === 'reading');
    }
  });

  test('isSkillScopeValue narrows instead of casting', () => {
    for (const skill of SKILL_SCOPE_ORDER) {
      expect(isSkillScopeValue(skill)).toBe(true);
    }
    expect(isSkillScopeValue('results')).toBe(false);
    expect(isSkillScopeValue('')).toBe(false);
    expect(isSkillScopeValue(null)).toBe(false);
    expect(isSkillScopeValue(undefined)).toBe(false);
    expect(isSkillScopeValue(42)).toBe(false);
  });
});
