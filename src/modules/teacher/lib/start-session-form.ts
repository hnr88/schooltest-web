import { DEFAULT_OPEN_SECTIONS, DEFAULT_WINDOW } from '@/modules/teacher/constants/start-session.constants';
import { zonedParts } from '@/modules/teacher/lib/start-session-schedule';
import { DEFAULT_SITTING_SETTINGS } from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  StartSessionFormState,
  StartSessionRequest,
  StartSessionSeed,
} from '@/modules/teacher/types/start-session-modal.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { DashboardClass, TeacherTest } from '@/modules/teacher/types/teacher.types';

/**
 * The form a request opens on: the asked-for class when it is one of the
 * teacher's, else their first; the first selectable test; an edit takes the
 * booking as saved.
 */
export function resolveInitialForm({
  request,
  classes,
  tests,
  booking,
  tomorrow,
}: {
  request: StartSessionRequest;
  classes: readonly DashboardClass[];
  tests: readonly TeacherTest[];
  booking: TeacherTestSession | null;
  tomorrow: string;
}): StartSessionFormState {
  const asked = classes.find((entry) => entry.class_document_id === request.classId);
  const base = initialFormState({
    classId: asked?.class_document_id ?? classes[0]?.class_document_id ?? '',
    formId: tests[0]?.form_document_id ?? '',
    mode: request.mode,
    tab: request.tab,
    studentIds: asked ? request.studentIds : [],
    tomorrow,
  });
  return booking ? formFromBooking(booking, base) : base;
}

/** The design's full reset (`startSessionOpen`), scoped by what the caller asked for. */
export function initialFormState(seed: StartSessionSeed): StartSessionFormState {
  return {
    mode: seed.mode ?? 'now',
    tab: seed.tab ?? 'test',
    classId: seed.classId,
    formId: seed.formId,
    scope: seed.studentIds.length > 0 ? 'some' : 'whole',
    picked: [...seed.studentIds],
    settings: { ...DEFAULT_SITTING_SETTINGS },
    date: seed.tomorrow,
    opens: DEFAULT_WINDOW.opens,
    closes: DEFAULT_WINDOW.closes,
    openSections: DEFAULT_OPEN_SECTIONS,
  };
}

/** "Edit scheduled session": the booking as saved, its window read in the zone the server used. */
export function formFromBooking(
  booking: TeacherTestSession,
  fallback: StartSessionFormState,
): StartSessionFormState {
  const window = booking.window ?? null;
  const opens = window ? zonedParts(new Date(window.opens_at), window.timezone) : null;
  const closes = window ? zonedParts(new Date(window.closes_at), window.timezone) : null;
  const members = Array.isArray(booking.member_student_ids) ? booking.member_student_ids : null;
  return {
    ...fallback,
    mode: 'later',
    classId: booking.class.document_id,
    formId: booking.form?.document_id ?? fallback.formId,
    scope: members ? 'some' : 'whole',
    picked: members ?? [],
    settings: booking.settings ? { ...booking.settings } : { ...DEFAULT_SITTING_SETTINGS },
    date: opens?.date ?? fallback.date,
    opens: opens?.time ?? fallback.opens,
    closes: closes?.time ?? fallback.closes,
  };
}
