import { TEST_SESSIONS_PATH } from '@/modules/teacher/constants/join-code.constants';
import type { TeacherTest, TestVariant } from '@/modules/teacher/types/teacher.types';

/** The C-TS-3 live grid for one sitting, addressed by its documentId. */
export function testSessionMonitorHref(sittingDocumentId: string): string {
  return `${TEST_SESSIONS_PATH}/${sittingDocumentId}`;
}

/**
 * The visible test name for the sitting's variant, taken from C-TD-2's own
 * `label` ("Reading diagnostic — Test A"). The portal keeps NO copy of that
 * text and never composes it from the variant letter, so a server-side rename
 * lands here untouched; an unmatched variant yields `null` rather than an
 * invented label.
 */
export function findTestLabel(
  tests: readonly TeacherTest[],
  variant: TestVariant | null,
): string | null {
  if (variant === null) return null;
  return tests.find((test) => test.variant === variant)?.label ?? null;
}
