'use client';

import { useStartSessionClassData } from '@/modules/teacher/hooks/useStartSessionClassData';
import { useStartSessionForm } from '@/modules/teacher/hooks/useStartSessionForm';
import { useStartSessionSubmit } from '@/modules/teacher/hooks/useStartSessionSubmit';
import {
  bookedInWindow,
  freeIds,
  mergeBlocked,
  pickedFreeIds,
  rosterEntries,
} from '@/modules/teacher/lib/start-session-members';
import { busyStudents } from '@/modules/teacher/lib/student-availability';
import {
  bookingBody,
  bookingMembers,
  bookingUpdateBody,
  ctaView,
  sittingCount,
  startNowBody,
} from '@/modules/teacher/lib/start-session-payload';
import { scheduleErrors, windowIso, zonedParts } from '@/modules/teacher/lib/start-session-schedule';
import type { BlockedMap, StartSessionFormState } from '@/modules/teacher/types/start-session-modal.types';
import type { DashboardClass, TeacherTest } from '@/modules/teacher/types/teacher.types';

const NO_BLOCKED: BlockedMap = new Map();

interface StartSessionModalInput {
  initial: StartSessionFormState;
  classes: readonly DashboardClass[];
  tests: readonly TeacherTest[];
  editSittingId: string | null;
}

/**
 * The modal's whole brain: its form, the class's live reads, and every value
 * the design derives from them (`mFree2`, `mCount2`, `schedErrs`, `canGo`,
 * `mStartLabel`) — through the pure libs, so what is shown and what is sent
 * are the same computation.
 */
export function useStartSessionModal({ initial, classes, tests, editSittingId }: StartSessionModalInput) {
  const formApi = useStartSessionForm(initial);
  const { form } = formApi;
  const isEdit = editSittingId !== null;
  const data = useStartSessionClassData(form.classId, form.mode, isEdit);
  const submit = useStartSessionSubmit(data.timeZone);

  const now = zonedParts(new Date(), data.timeZone);
  const errors =
    form.mode === 'later'
      ? scheduleErrors({
          date: form.date,
          opens: form.opens,
          closes: form.closes,
          timeLimit: form.settings.timeLimit,
          today: now.date,
          nowHm: now.time,
        })
      : [];
  const window = windowIso(form.date, form.opens, form.closes, data.timeZone);
  const rosterIds = data.roster.map((student) => student.id);
  const known =
    form.mode === 'now'
      ? busyStudents(data.openSittings, data.monitors)
      : bookedInWindow(data.bookings, window, form.date, editSittingId, rosterIds);
  const blocked = mergeBlocked(known, submit.failure?.blocked ?? NO_BLOCKED);
  const free = freeIds(data.roster, blocked);
  const pickedFree = pickedFreeIds(data.roster, blocked, form.picked);
  const count = sittingCount(form.scope, free, pickedFree);
  const cta = ctaView({ mode: form.mode, isEdit, count, scheduleErrorCount: errors.length });
  const isChecking = data.rosterPending || data.busyPending;
  const test = tests.find((entry) => entry.form_document_id === form.formId);
  // TB-17: the demo mints a link for the picked FORM alone, so it neither waits for
  // the roster nor needs a student — only a test to sit.
  const canSubmit =
    form.mode === 'demo'
      ? test !== undefined && !submit.isPending
      : cta.canGo && !isChecking && !submit.isPending;

  const onSubmit = () => {
    if (!canSubmit) return;
    if (form.mode === 'demo') {
      if (test === undefined) return;
      submit.startDemo(test.form_document_id, test.label);
      return;
    }
    if (form.mode === 'now') {
      submit.startNow(startNowBody(form, pickedFree));
      return;
    }
    if (window === null) return;
    const members = bookingMembers(form.scope, rosterIds.length, free, pickedFree);
    if (editSittingId) submit.saveBooking(editSittingId, bookingUpdateBody(form, window, members));
    else submit.book(bookingBody(form, window, members));
  };

  return {
    ...formApi,
    isEdit,
    klass: classes.find((entry) => entry.class_document_id === form.classId),
    test,
    data,
    errors,
    free,
    pickedFree,
    count,
    cta,
    canSubmit,
    isChecking,
    entries: rosterEntries(data.roster, blocked, form.picked),
    failure: submit.failure,
    isPending: submit.isPending,
    onSubmit,
  };
}
