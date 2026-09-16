import { describe, expect, test } from 'vitest';
import { deidentify } from '@/modules/results/lib/deidentify';

describe('deidentify — the copy-button guard', () => {
  test('replaces the full name and the bare first name', () => {
    const text = 'Amelia Ngo reads well. Amelia should keep practising inference.';
    expect(deidentify(text, 'Amelia Ngo')).toBe('The student reads well. The student should keep practising inference.');
  });

  test('a name that never appears leaves the text untouched', () => {
    expect(deidentify('Steady across strands.', 'Amelia Ngo')).toBe('Steady across strands.');
  });
});
