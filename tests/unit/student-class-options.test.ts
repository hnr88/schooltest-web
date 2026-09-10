import { describe, expect, test } from 'vitest';

import type { SchoolClass } from '@/modules/classes';
import { classAssignOptions } from '@/modules/school-students/lib/class-options';

function klass(documentId: string, name: string): SchoolClass {
  return { documentId, name, year_band: null, teachers: [], student_count: 0 };
}

describe('classAssignOptions', () => {
  test('excludes the current class and sorts the rest by name', () => {
    const classes = [klass('c2', 'Year 4B'), klass('c1', 'Year 4A'), klass('c3', 'Year 5A')];
    expect(classAssignOptions(classes, 'c2').map((option) => option.documentId)).toEqual([
      'c1',
      'c3',
    ]);
  });

  test('returns every class name-ordered when the student has no class, without mutating the input', () => {
    const classes = [klass('b', 'Zeta'), klass('a', 'Alpha')];
    const options = classAssignOptions(classes, null);
    expect(options.map((option) => option.documentId)).toEqual(['a', 'b']);
    expect(classes.map((option) => option.documentId)).toEqual(['b', 'a']);
  });

  test('yields an empty list when the only class is the current one', () => {
    const classes = [klass('only', 'Year 6')];
    expect(classAssignOptions(classes, 'only')).toEqual([]);
  });
});
