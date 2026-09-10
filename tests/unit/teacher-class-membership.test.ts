import { describe, expect, test } from 'vitest';

import type { SchoolClass } from '@/modules/classes';
import {
  classMembershipPatches,
  currentTeacherClassIds,
  removeTeacherPatch,
  withTeacher,
  withoutTeacher,
} from '@/modules/teachers/lib/teacher-class-membership';

function klass(documentId: string, teacherDocumentIds: string[]): SchoolClass {
  return {
    documentId,
    name: `Class ${documentId}`,
    year_band: null,
    student_count: 0,
    teachers: teacherDocumentIds.map((id) => ({
      documentId: id,
      first_name: null,
      last_name: null,
    })),
  };
}

const TEACHER = 'teacher-1';
const OTHER = 'teacher-2';

describe('teacher class membership helpers', () => {
  test('currentTeacherClassIds collects only classes that list the teacher', () => {
    const classes = [klass('c1', [TEACHER]), klass('c2', [OTHER]), klass('c3', [TEACHER, OTHER])];
    expect(currentTeacherClassIds(classes, TEACHER)).toEqual(new Set(['c1', 'c3']));
    expect(currentTeacherClassIds(classes, 'missing')).toEqual(new Set());
  });

  test('withTeacher unions without duplicating and preserves served order', () => {
    expect(withTeacher([OTHER, TEACHER], TEACHER)).toEqual([OTHER, TEACHER]);
    expect(withTeacher([OTHER], TEACHER)).toEqual([OTHER, TEACHER]);
  });

  test('withoutTeacher differences the teacher out and keeps the rest', () => {
    expect(withoutTeacher([OTHER, TEACHER, 'teacher-3'], TEACHER)).toEqual([OTHER, 'teacher-3']);
    expect(withoutTeacher([OTHER], TEACHER)).toEqual([OTHER]);
  });

  test('classMembershipPatches PATCHes only changed classes, once each', () => {
    const classes = [klass('c1', [TEACHER]), klass('c2', [OTHER]), klass('c3', [TEACHER, OTHER])];
    const selected = new Set(['c1', 'c2']);
    const patches = classMembershipPatches(classes, TEACHER, selected);
    expect(patches.map((patch) => patch.documentId)).toEqual(['c2', 'c3']);
  });

  test('an added class unions the served set instead of replacing it', () => {
    const patches = classMembershipPatches([klass('c1', [OTHER])], TEACHER, new Set(['c1']));
    expect(patches).toEqual([{ documentId: 'c1', teacherDocumentIds: [OTHER, TEACHER] }]);
  });

  test('a removed class differences the teacher out of the served set', () => {
    const patches = classMembershipPatches(
      [klass('c1', [OTHER, TEACHER])],
      TEACHER,
      new Set<string>(),
    );
    expect(patches).toEqual([{ documentId: 'c1', teacherDocumentIds: [OTHER] }]);
  });

  test('removeTeacherPatch returns null for unknown or empty served teachers', () => {
    expect(removeTeacherPatch(undefined, TEACHER)).toBeNull();
    expect(removeTeacherPatch(klass('c1', []), TEACHER)).toBeNull();
    expect(removeTeacherPatch(klass('c1', [OTHER]), TEACHER)).toBeNull();
  });

  test('removeTeacherPatch builds the minus-one payload for a listed teacher', () => {
    expect(removeTeacherPatch(klass('c1', [OTHER, TEACHER]), TEACHER)).toEqual({
      documentId: 'c1',
      teacherDocumentIds: [OTHER],
    });
  });
});
