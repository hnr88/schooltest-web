import type { ClassTeacher } from '@/modules/classes/types/classes.types';
import type { SchoolParticipation } from '@/modules/school-admin';

export function teacherName(firstName: string | null, lastName: string | null): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim();
}

export function teacherNames(teachers: ClassTeacher[]): string {
  return teachers
    .map((teacher) => teacherName(teacher.first_name, teacher.last_name))
    .filter((name) => name !== '')
    .join(', ');
}

// Spec §2 "Tests completed": per-test completion, so the numerator is the
// number of students in the class who have SUBMITTED the reading test, read
// from the C-RPT-04 participation payload (test_a is the diagnostic slot).
export function testsCompletedByClass(
  participation: SchoolParticipation | undefined,
): Map<string, number> {
  return new Map(
    (participation?.classes ?? []).map((row) => [row.documentId, row.test_a.submitted]),
  );
}

// "X / Y" where Y is the class's own student count, so the column always agrees
// with the Students column. A null map means participation could not be read -
// the count is unknown, so the empty value renders instead of a made-up zero.
export function formatTestsCompleted(
  completions: Map<string, number> | null,
  documentId: string,
  studentCount: number,
  emptyValue: string,
): string {
  if (completions === null) return emptyValue;
  return `${completions.get(documentId) ?? 0} / ${studentCount}`;
}
