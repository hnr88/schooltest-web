import { describe, expect, test } from 'vitest';
import {
  acaraPhaseKey,
  bandKey,
  formatDelta,
} from '@/modules/teacher/lib/teacher-kit';

describe('formatDelta', () => {
  test('arrow form, as the classes list draws it', () => {
    expect(formatDelta(4, 'arrow')).toEqual({ text: '↑4', direction: 'up' });
    expect(formatDelta(-2, 'arrow')).toEqual({ text: '↓2', direction: 'down' });
    expect(formatDelta(0.3, 'arrow')).toEqual({ text: '→0', direction: 'flat' });
  });

  test('signed form uses a true minus and ±0', () => {
    expect(formatDelta(7, 'signed')).toEqual({ text: '+7', direction: 'up' });
    expect(formatDelta(-3.6, 'signed', ' pts')).toEqual({ text: '−4 pts', direction: 'down' });
    expect(formatDelta(-0.2, 'signed')).toEqual({ text: '±0', direction: 'flat' });
  });

  test('arrowSigned form and the missing value', () => {
    expect(formatDelta(9, 'arrowSigned', '%')).toEqual({ text: '↑ +9%', direction: 'up' });
    expect(formatDelta(null, 'arrow')).toEqual({ text: '—', direction: 'none' });
    expect(formatDelta(undefined, 'signed', '', 'n/a')).toEqual({ text: 'n/a', direction: 'none' });
  });
});

describe('acaraPhaseKey and bandKey', () => {
  test('normalise served labels and refuse unknowns', () => {
    expect(acaraPhaseKey('Developing')).toBe('developing');
    expect(acaraPhaseKey('Consolidating phase')).toBe('consolidating');
    expect(acaraPhaseKey('developing_to_consolidating')).toBe('developing');
    expect(acaraPhaseKey(null)).toBeNull();
    expect(acaraPhaseKey('Advanced')).toBeNull();
    expect(bandKey('not_yet')).toBe('notYet');
    expect(bandKey('Secure')).toBe('secure');
    expect(bandKey('mastered')).toBeNull();
  });
});
