import { describe, expect, test } from 'vitest';

import fixture from '@/modules/teacher/lib/__fixtures__/start-session.t2.json';
import {
  bookingBody,
  bookingUpdateBody,
  ctaView,
  startNowBody,
} from '@/modules/teacher/lib/start-session-payload';
import {
  DEFAULT_SITTING_SETTINGS,
  createTestSessionBodySchema,
  updateTestSessionBodySchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { StartSessionFormState } from '@/modules/teacher/types/start-session-modal.types';

// Ids recorded from the live API as t2 (Reading 8B, its roster and Test A).
const classId = fixture.class_document_id;
const formId = fixture.tests.tests[0].form_document_id;
const rosterIds = fixture.roster.map((row) => row.student.document_id);

const form: StartSessionFormState = {
  mode: 'now',
  tab: 'settings',
  classId,
  formId,
  picked: [],
  settings: { ...DEFAULT_SITTING_SETTINGS, timeLimit: 30, skip: false },
  date: '2026-09-14',
  opens: '09:00',
  closes: '09:50',
  openSections: ['during'],
};
const window = { opens_at: '2026-09-14T06:00:00.000Z', closes_at: '2026-09-14T06:50:00.000Z' };

describe('start now (C-TS-1 with start:true)', () => {
  test('the picked students are always sent as explicit ids, with every setting', () => {
    const body = startNowBody(form, [rosterIds[0], rosterIds[1]]);
    expect(body).toEqual({
      class_document_id: classId,
      form_document_id: formId,
      student_document_ids: [rosterIds[0], rosterIds[1]],
      settings: { ...DEFAULT_SITTING_SETTINGS, timeLimit: 30, skip: false },
      start: true,
    });
    expect(createTestSessionBodySchema.parse(body)).toEqual(body);
  });

  test('select all is still an explicit list: every roster id is named, never omitted', () => {
    const body = startNowBody(form, rosterIds);
    expect(body.student_document_ids).toEqual(rosterIds);
    expect(createTestSessionBodySchema.parse(body)).toEqual(body);
  });
});

describe('booking (C-TS-1 with window, C-TS-5)', () => {
  test('a new booking carries the window, the picked ids and never `start`', () => {
    const body = bookingBody({ ...form, mode: 'later' }, window, [rosterIds[3]]);
    expect(body).toEqual({
      class_document_id: classId,
      form_document_id: formId,
      student_document_ids: [rosterIds[3]],
      settings: form.settings,
      window,
    });
    expect(createTestSessionBodySchema.parse(body)).toEqual(body);
  });

  test('an edit re-sends window, form, the picked ids (never null) and settings', () => {
    const body = bookingUpdateBody({ ...form, mode: 'later' }, window, rosterIds);
    expect(body).toEqual({ window, form_document_id: formId, student_document_ids: rosterIds, settings: form.settings });
    expect(updateTestSessionBodySchema.parse(body)).toEqual(body);
  });
});

describe('the CTA (design §7.4 `mStartLabel`)', () => {
  test('label and whether it can go', () => {
    expect(ctaView({ mode: 'demo', isEdit: false, count: 0, scheduleErrorCount: 0 })).toEqual({ labelKey: 'startDemo', count: 0, canGo: true });
    expect(ctaView({ mode: 'now', isEdit: false, count: 0, scheduleErrorCount: 0 }).labelKey).toBe('selectToStart');
    expect(ctaView({ mode: 'later', isEdit: false, count: 0, scheduleErrorCount: 2 }).labelKey).toBe('selectToSchedule');
    expect(ctaView({ mode: 'later', isEdit: false, count: 3, scheduleErrorCount: 1 })).toEqual({ labelKey: 'fixTiming', count: 3, canGo: false });
    expect(ctaView({ mode: 'now', isEdit: false, count: 18, scheduleErrorCount: 5 })).toEqual({ labelKey: 'start', count: 18, canGo: true });
    expect(ctaView({ mode: 'later', isEdit: true, count: 2, scheduleErrorCount: 0 })).toEqual({ labelKey: 'save', count: 2, canGo: true });
    expect(ctaView({ mode: 'later', isEdit: false, count: 2, scheduleErrorCount: 0 }).labelKey).toBe('schedule');
  });
});
