import { describe, expect, test } from 'vitest';

import {
  EMPTY_TEACHER_LIST_SUPPORTED,
  matchesStudentSearch,
  removalAllowed,
  studentsNotInClass,
  unionTeacherIds,
  withoutTeacherId,
} from '@/modules/classes/lib/class-roster.helpers';

const TEACHER = { documentId: 't1', first_name: 'Ada', last_name: 'Lovelace' };

function student(documentId: string, given = 'Sam', family = 'Nguyen') {
  return { documentId, given_name: given, family_name: family };
}

describe('class roster helpers', () => {
  test('unionTeacherIds keeps the served teacher first and dedupes the picks', () => {
    expect(unionTeacherIds(TEACHER, ['t2', 't1', 't3'])).toEqual(['t1', 't2', 't3']);
    expect(unionTeacherIds(null, ['t2', 't2'])).toEqual(['t2']);
    expect(unionTeacherIds(TEACHER, [])).toEqual(['t1']);
  });

  test('withoutTeacherId differences the removed teacher out and keeps the rest', () => {
    expect(withoutTeacherId(TEACHER, 't2')).toEqual(['t1']);
    expect(withoutTeacherId(TEACHER, 't1')).toEqual([]);
    expect(withoutTeacherId(null, 't1')).toEqual([]);
  });

  test('removing the last teacher ships the empty unassign payload the server accepts', () => {
    const next = withoutTeacherId(TEACHER, TEACHER.documentId);
    expect(next).toEqual([]);
    expect(EMPTY_TEACHER_LIST_SUPPORTED).toBe(true);
    expect(removalAllowed(next)).toBe(true);
    expect(removalAllowed(['t1'])).toBe(true);
  });

  test('studentsNotInClass excludes every roster member by documentId', () => {
    const school = [student('s1'), student('s2'), student('s3')];
    expect(studentsNotInClass(school, [{ documentId: 's2' }]).map((row) => row.documentId)).toEqual([
      's1',
      's3',
    ]);
    expect(studentsNotInClass(school, school)).toEqual([]);
    expect(studentsNotInClass(school, [])).toHaveLength(3);
  });

  test('matchesStudentSearch filters by the display name, case-insensitively', () => {
    const row = student('s1', 'Mia', "O'Kelly");
    expect(matchesStudentSearch(row, 'mia')).toBe(true);
    expect(matchesStudentSearch(row, "o'k")).toBe(true);
    expect(matchesStudentSearch(row, '  MIA  ')).toBe(true);
    expect(matchesStudentSearch(row, 'zoe')).toBe(false);
    expect(matchesStudentSearch(row, '')).toBe(true);
  });
});
