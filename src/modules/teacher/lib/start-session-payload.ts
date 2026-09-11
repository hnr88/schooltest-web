import type {
  CtaView,
  SessionWindowIso,
  StartSessionFormState,
  StudentScope,
} from '@/modules/teacher/types/start-session-modal.types';
import type { StartSessionMode } from '@/modules/teacher/types/start-session.types';
import type {
  CreateTestSessionBody,
  UpdateTestSessionBody,
} from '@/modules/teacher/types/teacher-session.types';

/** How many sit it: every free student, or the picked free ones (`mCount2`). */
export function sittingCount(
  scope: StudentScope,
  free: readonly string[],
  pickedFree: readonly string[],
): number {
  return scope === 'whole' ? free.length : pickedFree.length;
}

/** A booking's members: null when the whole class is free, else the free or picked list. */
export function bookingMembers(
  scope: StudentScope,
  rosterSize: number,
  free: readonly string[],
  pickedFree: readonly string[],
): string[] | null {
  if (scope === 'some') return [...pickedFree];
  return free.length === rosterSize ? null : [...free];
}

/**
 * Start now: the whole class sends no ids, so the server decides WHO with its
 * own busy rule (null, or the free students); selected students are sent.
 */
export function startNowBody(
  form: StartSessionFormState,
  pickedFree: readonly string[],
): CreateTestSessionBody {
  return {
    class_document_id: form.classId,
    form_document_id: form.formId,
    ...(form.scope === 'some' ? { student_document_ids: [...pickedFree] } : {}),
    settings: { ...form.settings },
    start: true,
  };
}

/** Schedule a window: the server refuses `window` together with `start: true`. */
export function bookingBody(
  form: StartSessionFormState,
  window: SessionWindowIso,
  members: string[] | null,
): CreateTestSessionBody {
  return {
    class_document_id: form.classId,
    form_document_id: form.formId,
    ...(members ? { student_document_ids: members } : {}),
    settings: { ...form.settings },
    window,
  };
}

/** Edit a booking: everything the modal shows; `null` members is the whole class again. */
export function bookingUpdateBody(
  form: StartSessionFormState,
  window: SessionWindowIso,
  members: string[] | null,
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
