import { describe, expect, test } from 'vitest';

import fixture from '@/modules/teacher/lib/__fixtures__/start-session.t2.json';
import { formFromBooking, initialFormState, resolveInitialForm } from '@/modules/teacher/lib/start-session-form';
import { isStartSessionTab } from '@/modules/teacher/lib/start-session-view';
import {
  teacherDashboardResponseSchema,
  teacherTestsResponseSchema,
} from '@/modules/teacher/schemas/teacher.schema';
import {
  DEFAULT_SITTING_SETTINGS,
  teacherTestSessionsResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

const [row] = teacherTestSessionsResponseSchema.parse(fixture.open).sessions;
const rosterIds = fixture.roster.map((entry) => entry.student.document_id);
const seed = {
  classId: fixture.class_document_id,
  formId: fixture.tests.tests[0].form_document_id,
  mode: null,
  tab: null,
  studentIds: [],
  tomorrow: '2026-09-12',
};

describe('initialFormState', () => {
  test('the design reset: start now, Test tab, whole class, default settings, tomorrow 09:00–10:00', () => {
    expect(initialFormState(seed)).toEqual({
      mode: 'now',
      tab: 'test',
      classId: seed.classId,
      formId: seed.formId,
      scope: 'whole',
      picked: [],
      settings: DEFAULT_SITTING_SETTINGS,
      date: '2026-09-12',
      opens: '09:00',
      closes: '10:00',
      openSections: ['during'],
    });
  });

  test('a catch-up arrives with its students picked, on the tab it asked for', () => {
    const state = initialFormState({ ...seed, studentIds: [rosterIds[0]], tab: 'students' });
    expect(state).toMatchObject({ scope: 'some', picked: [rosterIds[0]], tab: 'students' });
  });
});

describe('resolveInitialForm', () => {
  const classes = teacherDashboardResponseSchema.parse(fixture.dashboard).classes;
  const tests = teacherTestsResponseSchema.parse(fixture.tests).tests;
  const request = { classId: null, mode: null, tab: null, studentIds: [] };

  test('no class asked for → the teacher’s first class and first test', () => {
    expect(resolveInitialForm({ request, classes, tests, booking: null, tomorrow: '2026-09-12' })).toMatchObject({
      classId: classes[0].class_document_id,
      formId: tests[0].form_document_id,
    });
  });

  test('a class that is not the teacher’s falls back, and its students are not carried over', () => {
    const state = resolveInitialForm({
      request: { ...request, classId: 'notmyclass00000000000001', studentIds: [rosterIds[0]] },
      classes,
      tests,
      booking: null,
      tomorrow: '2026-09-12',
    });
    expect(state).toMatchObject({ classId: classes[0].class_document_id, scope: 'whole', picked: [] });
  });
});

describe('isStartSessionTab', () => {
  test('only the three tab keys pass', () => {
    expect(['test', 'students', 'settings', 'live', 3].map(isStartSessionTab)).toEqual([true, true, true, false, false]);
  });
});

describe('formFromBooking', () => {
  // A booking derived from the recorded open row: phase scheduled, a window, two members.
  const booking: TeacherTestSession = {
    ...row,
    phase: 'scheduled',
    code: null,
    opened_at: null,
    form: { document_id: fixture.tests.tests[1].form_document_id, label: fixture.tests.tests[1].label, variant: 'B' },
    member_student_ids: [rosterIds[0], rosterIds[1]],
    settings: { ...DEFAULT_SITTING_SETTINGS, timeLimit: 50 },
    window: { opens_at: '2026-09-14T06:15:00.000Z', closes_at: '2026-09-14T07:15:00.000Z', timezone: 'Europe/Bucharest' },
  };

  test('the saved form, members, settings and window, read in the booking zone', () => {
    const state = formFromBooking(booking, initialFormState(seed));
    expect(state).toMatchObject({
      mode: 'later',
      classId: row.class.document_id,
      formId: fixture.tests.tests[1].form_document_id,
      scope: 'some',
      picked: [rosterIds[0], rosterIds[1]],
      date: '2026-09-14',
      opens: '09:15',
      closes: '10:15',
    });
    expect(state.settings.timeLimit).toBe(50);
  });

  test('a whole-class booking with no saved settings reads as the whole class on the defaults', () => {
    const state = formFromBooking({ ...booking, member_student_ids: null, settings: null }, initialFormState(seed));
    expect(state).toMatchObject({ scope: 'whole', picked: [], settings: DEFAULT_SITTING_SETTINGS });
  });
});
