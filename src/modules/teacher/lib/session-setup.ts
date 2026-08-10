import type { ChoiceOption } from '@/modules/design-system';
import type { TeacherClass } from '@/modules/teacher/types/teacher-class.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';
import type {
  TestSessionSetupCounts,
  TestSessionSetupStatus,
} from '@/modules/teacher/types/session-setup.types';

/** One option per class the API returned for THIS teacher — never a literal list. */
export function toClassOptions(classes: readonly TeacherClass[]): ChoiceOption[] {
  return classes.map((entry) => ({ value: entry.documentId, label: entry.name }));
}

/**
 * One option per selectable test. The visible text is C-TD-2's own `label`
 * ("Reading diagnostic — Test A"): the portal neither composes it from the
 * variant nor keeps a copy of it, so a server-side rename lands here untouched.
 */
export function toTestOptions(tests: readonly TeacherTest[]): ChoiceOption[] {
  return tests.map((test) => ({ value: test.form_document_id, label: test.label }));
}

/**
 * Error beats pending beats emptiness: a count of 0 is only ever reported when
 * BOTH reads actually came back, so "you have no classes" can never be a
 * loading frame or a swallowed failure wearing an empty state.
 */
export function deriveSetupStatus(counts: TestSessionSetupCounts): TestSessionSetupStatus {
  if (counts.isError) return 'error';
  if (counts.isLoading || !counts.isSuccess) return 'loading';
  if (counts.classCount === 0) return 'no-classes';
  if (counts.testCount === 0) return 'no-tests';
  return 'ready';
}
