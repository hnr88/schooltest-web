import type {
  ClassTeacher,
  ClassTestCompletion,
  ClassTestCompletionDisplay,
} from '@/modules/classes/types/classes.types';
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

// Spec §2 "Tests completed": each student sits TWO reading tests and the column
// shows PER-TEST completion, so BOTH C-RPT-04 slots are carried per class. The
// numerator of each is the number of students in the class who have SUBMITTED
// that test; reading test_a alone dropped half of every class's completion.
export function testsCompletedByClass(
  participation: SchoolParticipation | undefined,
): Map<string, ClassTestCompletion> {
  return new Map(
    (participation?.classes ?? []).map((row) => [
      row.documentId,
      { testA: row.test_a.submitted, testB: row.test_b.submitted },
    ]),
  );
}

// One "X / Y" per test, where Y is the class's own student count so both
// fractions agree with the Students column (C-RPT-04 buckets the same active
// roster, so its roster_count and student_count are the same number). A null
// map means participation could not be read - the counts are unknown, so the
// caller renders the empty value instead of a made-up zero.
export function formatTestsCompleted(
  completions: Map<string, ClassTestCompletion> | null,
  documentId: string,
  studentCount: number,
): ClassTestCompletionDisplay | null {
  if (completions === null) return null;
  const counts = completions.get(documentId) ?? { testA: 0, testB: 0 };
  return {
    testA: `${counts.testA} / ${studentCount}`,
    testB: `${counts.testB} / ${studentCount}`,
  };
}
