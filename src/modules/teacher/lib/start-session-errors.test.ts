import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { createTranslator } from 'next-intl';
import { describe, expect, test } from 'vitest';

import fixture from '@/modules/teacher/lib/__fixtures__/start-session.t2.json';
import { STUDENT_CATALOGS } from '@/modules/teacher/lib/__fixtures__/student-translators';
import { describeDemoLinkFailure, describeStartSessionFailure } from '@/modules/teacher/lib/start-session-errors';
import type { DemoLimitTranslate } from '@/modules/teacher/types/start-session-modal.types';

function rejected(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, statusText: '', headers: {}, config, data } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response);
}

// Recorded from the live API as t2: a create naming a student already in an open
// sitting (409) and one naming a document id that is not on the roster (400).
const busy = fixture.create_409_busy;
const notOnRoster = fixture.create_400_not_on_roster;

describe('describeStartSessionFailure', () => {
  test('409 busy: the server sentence, and the named students greyed as already sitting', () => {
    const failure = describeStartSessionFailure(rejected(busy.status, busy.body), 'Europe/Bucharest');
    expect(failure.message).toBe(busy.body.error.message);
    expect(failure.scheduleMessages).toEqual([]);
    expect([...failure.blocked]).toEqual(
      busy.body.error.details.busy_student_document_ids.map((id) => [id, { kind: 'sitting', formLabel: '' }]),
    );
  });

  test('400 not on the roster: the server sentence, nothing greyed', () => {
    const failure = describeStartSessionFailure(rejected(notOnRoster.status, notOnRoster.body), 'Europe/Bucharest');
    expect(failure).toEqual({ message: notOnRoster.body.error.message, scheduleMessages: [], blocked: new Map() });
  });

  test('400 refused window: the design sentences the server sent, shown as they are', () => {
    const body = structuredClone(notOnRoster.body);
    const scheduleErrors = [
      { reason: 'window_shorter_than_time_limit', message: 'The window is 20 minutes but the test allows 40. Widen the window or shorten the time limit under Settings.' },
      { reason: 'start_earlier_today', message: 'That start time is earlier today. Pick a later time, or start the session now instead.' },
    ];
    Object.assign(body.error.details, { schedule_errors: scheduleErrors });
    const failure = describeStartSessionFailure(rejected(400, body), 'Europe/Bucharest');
    expect(failure.scheduleMessages).toEqual(scheduleErrors.map((entry) => entry.message));
    expect(failure.message).toBe('');
  });

  test('409 window clash: the clashing students greyed as booked, at the school-zone start', () => {
    const body = structuredClone(busy.body);
    const [studentId] = body.error.details.busy_student_document_ids;
    const form = { document_id: fixture.tests.tests[1].form_document_id, label: fixture.tests.tests[1].label, variant: 'B' };
    Object.assign(body.error.details, {
      clashes: [
        {
          sitting_document_id: fixture.open.sessions[0].sitting_document_id,
          phase: 'scheduled',
          form,
          opens_at: '2026-09-14T06:15:00.000Z',
          closes_at: '2026-09-14T07:15:00.000Z',
          student_document_ids: [studentId],
        },
      ],
    });
    const failure = describeStartSessionFailure(rejected(409, body), 'Europe/Bucharest');
    expect(failure.blocked.get(studentId)).toEqual({ kind: 'booked', formLabel: form.label, opensAt: '09:15' });
  });

  test('a transport failure keeps its own message', () => {
    expect(describeStartSessionFailure(new Error('Network Error'), 'UTC').message).toBe('Network Error');
  });
});

function demoLimit(locale: string): DemoLimitTranslate {
  const t = createTranslator({
    locale,
    messages: STUDENT_CATALOGS[locale],
    namespace: 'TeacherPortal.startSession.demoLimit',
    onError: (error) => {
      throw error;
    },
  });
  return t as unknown as DemoLimitTranslate;
}

// The API's 429 envelope for a spent per-hour demo-link budget (RateLimitError).
const spent = (details: Record<string, unknown>) => ({
  data: null,
  error: { status: 429, name: 'RateLimitError', message: 'Too many requests', details },
});

describe('describeDemoLinkFailure', () => {
  const en = demoLimit('en');

  test('429 with the wait: the budget is named and the wait rounds UP to whole minutes', () => {
    const failure = describeDemoLinkFailure(rejected(429, spent({ retry_after_seconds: 540 })), 'UTC', en);
    expect(failure).toEqual({
      message: "You've opened the maximum number of demo links this hour. Try again in 9 minutes.",
      scheduleMessages: [],
      blocked: new Map(),
    });
    expect(describeDemoLinkFailure(rejected(429, spent({ retry_after_seconds: 541 })), 'UTC', en).message).toContain(
      'Try again in 10 minutes.',
    );
    expect(describeDemoLinkFailure(rejected(429, spent({ retry_after_seconds: 12 })), 'UTC', en).message).toContain(
      'Try again in 1 minute.',
    );
  });

  test('429 without the wait (or not in the API envelope): never a bare "Too many requests"', () => {
    const later = "You've opened the maximum number of demo links this hour. Try again later.";
    expect(describeDemoLinkFailure(rejected(429, spent({})), 'UTC', en).message).toBe(later);
    expect(describeDemoLinkFailure(rejected(429, '<html>429</html>'), 'UTC', en).message).toBe(later);
  });

  test('any other refusal keeps the server sentence, as a refused create does', () => {
    const body = { data: null, error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: {} } };
    expect(describeDemoLinkFailure(rejected(403, body), 'UTC', en)).toEqual({
      message: 'Forbidden',
      scheduleMessages: [],
      blocked: new Map(),
    });
    expect(describeDemoLinkFailure(new Error('Network Error'), 'UTC', en).message).toBe('Network Error');
  });

  test.each(Object.keys(STUDENT_CATALOGS))('%s: both sentences exist and the wait is printed', (locale) => {
    const t = demoLimit(locale);
    const withWait = describeDemoLinkFailure(rejected(429, spent({ retry_after_seconds: 720 })), 'UTC', t).message;
    const without = describeDemoLinkFailure(rejected(429, spent({})), 'UTC', t).message;
    expect(withWait).toContain('12');
    expect(withWait).not.toMatch(/[{}]/);
    expect(without.length).toBeGreaterThan(0);
    expect(without).not.toBe('Too many requests');
    expect(withWait).not.toBe(without);
  });
});
