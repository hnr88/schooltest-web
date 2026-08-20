import type {
  ClassDetailTeacher,
  StudentTestResult,
  TestSlot,
} from '@/modules/classes/types/class-detail.types';

// Pure cell/label formatting for the class detail surfaces. The components stay
// presentational; nothing here derives a phase from a score — the backend owns
// that (spec §"ACARA EAL/D Phase Mapping").

/** The spec's empty value for a measurement that does not exist. */
export const EMPTY_VALUE = '—';

export function teacherDisplayName(teacher: ClassDetailTeacher | null): string | null {
  if (teacher === null) return null;
  const name = [teacher.first_name, teacher.last_name].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : null;
}

export function studentDisplayName(student: {
  given_name: string | null;
  family_name: string | null;
}): string {
  return [student.given_name, student.family_name].filter(Boolean).join(' ').trim();
}

/** The A-then-B slot lookup; the wire always carries both, this keeps the read total. */
export function testFor(
  tests: readonly StudentTestResult[],
  slot: TestSlot,
): StudentTestResult | null {
  return tests.find((test) => test.test_id === slot) ?? null;
}

/** Score cell: the measured value, or the spec's em dash when there is none. */
export function scoreLabel(test: StudentTestResult | null): string {
  return test?.overall_score === null || test === null ? EMPTY_VALUE : String(test.overall_score);
}
