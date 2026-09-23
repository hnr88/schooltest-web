import type {
  CtaView,
  SessionWindowIso,
  StartSessionFormState,
} from '@/modules/teacher/types/start-session-modal.types';
import type { StartSessionMode } from '@/modules/teacher/types/start-session.types';
import type {
  CreateTestSessionBody,
  UpdateTestSessionBody,
} from '@/modules/teacher/types/teacher-session.types';

/** Start now: WHO sits it is always the picked free students, named explicitly. */
export function startNowBody(
  form: StartSessionFormState,
  pickedFree: readonly string[],
): CreateTestSessionBody {
  return {
    class_document_id: form.classId,
    form_document_id: form.formId,
    student_document_ids: [...pickedFree],
    settings: { ...form.settings },
    start: true,
  };
}

/** Schedule a window: the server refuses `window` together with `start: true`. */
export function bookingBody(
  form: StartSessionFormState,
  window: SessionWindowIso,
  members: string[],
): CreateTestSessionBody {
  return {
    class_document_id: form.classId,
    form_document_id: form.formId,
    student_document_ids: members,
    settings: { ...form.settings },
    window,
  };
}

/** Edit a booking: everything the modal shows, the members named explicitly. */
export function bookingUpdateBody(
  form: StartSessionFormState,
  window: SessionWindowIso,
  members: string[],
): UpdateTestSessionBody {
  return {
    window,
    form_document_id: form.formId,
    student_document_ids: members,
    settings: { ...form.settings },
  };
}

/** The design's `mStartLabel` / `canGo` (§7.4). */
export function ctaView({
  mode,
  isEdit,
  count,
  scheduleErrorCount,
}: {
  mode: StartSessionMode;
  isEdit: boolean;
  count: number;
  scheduleErrorCount: number;
}): CtaView {
  if (mode === 'demo') return { labelKey: 'startDemo', count, canGo: true };
  if (count === 0) return { labelKey: mode === 'now' ? 'selectToStart' : 'selectToSchedule', count, canGo: false };
  if (mode === 'later' && scheduleErrorCount > 0) return { labelKey: 'fixTiming', count, canGo: false };
  if (mode === 'now') return { labelKey: 'start', count, canGo: true };
  return { labelKey: isEdit ? 'save' : 'schedule', count, canGo: true };
}
