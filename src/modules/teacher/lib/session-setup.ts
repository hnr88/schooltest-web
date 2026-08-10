import type { ChoiceOption } from '@/modules/design-system';
import type { DashboardClass, TeacherTest } from '@/modules/teacher/types/teacher.types';
import type {
  TestSessionSetupCounts,
  TestSessionSetupStatus,
} from '@/modules/teacher/types/session-setup.types';

/**
 * One option per class C-TD-1 returned for THIS teacher — never a literal list.
 * The value is the `class_document_id` C-TS-1 expects as `class_document_id`,
 * so what the teacher picked is what the create is told, with no re-lookup.
 */
export function toClassOptions(classes: readonly DashboardClass[]): ChoiceOption[] {
  return classes.map((entry) => ({ value: entry.class_document_id, label: entry.name }));
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
