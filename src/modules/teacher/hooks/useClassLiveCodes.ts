'use client';

import { isLiveSitting } from '@/modules/teacher/lib/live-rollup';
import { selectLiveSitting } from '@/modules/teacher/lib/live-tab';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import type {
  ClassLiveCodeView,
  ClassLiveCodesState,
} from '@/modules/teacher/types/results-shell.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

function toCodeView(session: TeacherTestSession): ClassLiveCodeView {
  return {
    sittingId: session.sitting_document_id,
    code: session.code,
    testLabel: session.form?.label ?? null,
  };
}

/**
 * The class's open sittings for the sticky code bar. It is the SAME C-TS-2 read
 * the Live tab already makes (`useLiveTab`, identical params ⇒ identical query
 * key), so the bar adds no second poll — it observes the one cache entry. The
 * shown sitting follows the tab's own rule (`selectLiveSitting`): `?session=`
 * when it names a live sitting, else the first live one; a booking never counts.
 */
export function useClassLiveCodes(
  classDocumentId: string,
  sessionId: string | null,
): ClassLiveCodesState {
  const open = useTestSessionsQuery(true, { status: 'open', class: classDocumentId });
  const rows = open.data?.sessions ?? [];
  const selected = selectLiveSitting(rows, sessionId);

  return {
    sittings: rows.filter(isLiveSitting).map(toCodeView),
    active: selected === null ? null : toCodeView(selected),
  };
}
