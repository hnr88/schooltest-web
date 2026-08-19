import { describe, expect, it } from 'vitest';

import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';

/**
 * First user of the new unit tier (Lane J, orchestrator assignment): pure
 * name-composition logic that every student-facing surface shares. Offline by
 * construction — no network, no store, no render — so it answers in
 * milliseconds instead of a rate-limited login.
 */

describe('getStudentDisplayName', () => {
  it('joins given + family in order', () => {
    expect(getStudentDisplayName({ given_name: 'Mia', family_name: 'Keller' }, '?')).toBe(
      'Mia Keller',
    );
  });

  it('returns just the given name for a mononym', () => {
    expect(getStudentDisplayName({ given_name: 'Kesav', family_name: null }, '?')).toBe('Kesav');
  });

  it('returns the fallback when there is no name at all', () => {
    expect(getStudentDisplayName({ given_name: null, family_name: null }, 'Unknown student')).toBe(
      'Unknown student',
    );
  });

  it('trims whitespace and never renders a dangling separator', () => {
    expect(getStudentDisplayName({ given_name: '  Mia ', family_name: ' ' }, '?')).toBe('Mia');
  });
});

describe('getStudentInitials', () => {
  it('builds upper-case initials from both parts', () => {
    expect(getStudentInitials({ given_name: 'mia', family_name: 'keller' })).toBe('MK');
  });

  it('uses the single initial for a mononym', () => {
    expect(getStudentInitials({ given_name: 'kesav', family_name: null })).toBe('K');
  });

  it('falls back to ? when there is no name at all', () => {
    expect(getStudentInitials({ given_name: null, family_name: null })).toBe('?');
  });
});
