import { TEST_SESSIONS_PATH } from '@/modules/teacher/constants/join-code.constants';
import type { JoinCodeView } from '@/modules/teacher/types/join-code.types';
import type {
  DashboardLiveSession,
  TeacherTest,
  TestVariant,
} from '@/modules/teacher/types/teacher.types';

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
function findTestLabel(tests: readonly TeacherTest[], variant: TestVariant | null): string | null {
  if (variant === null) return null;
  return tests.find((test) => test.variant === variant)?.label ?? null;
}

/**
 * The join code the teacher reads out, derived from ONE live read: C-TD-1's
 * `live_session` — "the caller's most recently opened `status:'open'` sitting".
 *
 * That is deliberately the same source before and after a reload. The create
 * (C-TS-1) does not hand its 201 to this panel; it invalidates the `teacher`
 * queries, the dashboard re-reads, and the newly minted sitting IS the most
 * recently opened one. So the code on screen is always the server's current
 * answer, and F5 cannot change it. Nothing is cached client-side, nothing is
 * minted client-side (DECISIONS.md A3), and a missing code is reported as a
 * missing code rather than filled in.
 */
export function resolveJoinCodeView(
  liveSession: DashboardLiveSession | null | undefined,
  tests: readonly TeacherTest[],
): JoinCodeView {
  if (!liveSession) return { status: 'absent' };
  if (liveSession.code === null) {
    return { status: 'unavailable', className: liveSession.class_name };
  }
  return {
    status: 'ready',
    sittingDocumentId: liveSession.sitting_document_id,
    code: liveSession.code,
    className: liveSession.class_name,
    testLabel: findTestLabel(tests, liveSession.test_variant),
    monitorHref: testSessionMonitorHref(liveSession.sitting_document_id),
  };
}
