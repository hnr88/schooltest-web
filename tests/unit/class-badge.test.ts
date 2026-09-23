import { describe, expect, test } from 'vitest';

import { classBadge } from '@/modules/classes/lib/classes-table.helpers';

describe('classBadge — the class chip label always fits its tile', () => {
  test('the "8B"-shaped class token wins, wherever it sits in the name', () => {
    expect(classBadge('8B English')).toBe('8B');
    expect(classBadge('Reading 8A — Farsi (School B)')).toBe('8A');
    expect(classBadge('EAL/D Year 7 - Room 4')).toBe('7');
    expect(classBadge('7a EAL/D')).toBe('7A');
  });

  test('without one, the initials of the first two words, punctuation skipped', () => {
    expect(classBadge('Comprehensive Reading Intervention Programme')).toBe('CR');
    expect(classBadge('— honours (stream)')).toBe('HS');
    expect(classBadge('Mathematics')).toBe('M');
  });

  test('never longer than three characters, empty for no name', () => {
    expect(classBadge('12AB Extension')).toBe('12A');
    for (const name of [
      'Comprehensive Reading Intervention Programme — Year 10 Honours',
      'W3 Ops CRUD Renamed 1789418200319',
    ]) {
      expect(classBadge(name).length).toBeLessThanOrEqual(3);
    }
    expect(classBadge(null)).toBe('');
    expect(classBadge('   ')).toBe('');
  });
});
