import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, test } from 'vitest';

import recorded from '@/modules/teacher/lib/__fixtures__/live-tab.t2.json';
import {
  clockLabel,
  closeConfirmFacts,
  connectionCounts,
  controlFailure,
  dayMonthLabel,
  effectiveSettings,
  hasPausable,
  historyIsTruncated,
  historyRows,
  roomState,
  selectLiveSitting,
  settingsOnCount,
  workingStudents,
} from '@/modules/teacher/lib/live-tab';
import {
  DEFAULT_SITTING_SETTINGS,
  teacherTestSessionSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';

// Every input is a response recorded from the live API as t2 (`_source` in the
// fixture); edge cases are derived from a recorded response, never invented.
const openRows = teacherTestSessionSchema.array().parse(recorded.openRows);
const closedRows = teacherTestSessionSchema.array().parse(recorded.closedPage.sessions);
const monitor = (key: keyof typeof recorded.monitors) =>
  testSessionMonitorResponseSchema.parse(recorded.monitors[key]);
const [probe] = openRows;
if (probe === undefined) throw new Error('fixture has no open row');

function refusal(key: keyof typeof recorded.refusals): AxiosError {
  const { status, data } = recorded.refusals[key];
  return new AxiosError('refused', String(status), undefined, undefined, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe('selectLiveSitting', () => {
  test('the ?session= sitting wins when it is live', () => {
    expect(selectLiveSitting(openRows, openRows[2]?.sitting_document_id ?? null)).toBe(openRows[2]);
  });

  test('an unknown or missing session falls back to the first live row', () => {
    expect(selectLiveSitting(openRows, 'nope')).toBe(probe);
    expect(selectLiveSitting(openRows, null)).toBe(probe);
  });

  test('a booking is never selected, even when named', () => {
    const booked = openRows.map((row, index) => (index === 0 ? { ...row, phase: 'scheduled' as const } : row));
    expect(selectLiveSitting(booked, probe.sitting_document_id)).toBe(booked[1]);
    expect(selectLiveSitting([], null)).toBeNull();
  });
});

describe('who is still working', () => {
  test('nobody before anyone joins, and a room pause keeps the joined student working', () => {
    expect(workingStudents(monitor('fresh').students)).toHaveLength(0);
    expect(workingStudents(monitor('joined').students).map((s) => s.display_name)).toEqual(['Amara B.']);
    expect(workingStudents(monitor('paused').students).map((s) => s.state)).toEqual(['paused']);
    expect(workingStudents(monitor('closed').students)).toHaveLength(0);
  });

  test('a pause reaches only someone working and not already paused', () => {
    expect(hasPausable(monitor('fresh').students)).toBe(false);
    expect(hasPausable(monitor('joined').students)).toBe(true);
    expect(hasPausable(monitor('paused').students)).toBe(false);
  });
});

describe('connectionCounts', () => {
  test('counts the served connection of the students still working', () => {
    expect(connectionCounts(monitor('joined').students)).toEqual({ online: 1, weak: 0, offline: 0, working: 1 });
    expect(connectionCounts(monitor('fresh').students)).toEqual({ online: 0, weak: 0, offline: 0, working: 0 });
  });

  test('an offline device counts as offline, never as online', () => {
    const students = monitor('joined').students.map((s) =>
      s.state === 'joined' ? { ...s, connection: 'offline' as const } : s,
    );
    expect(connectionCounts(students)).toEqual({ online: 0, weak: 0, offline: 1, working: 1 });
  });
});

describe('roomState', () => {
  test('a paused room carries when the pause began', () => {
    expect(roomState(monitor('paused').sitting)).toEqual({
      paused: true,
      pausedAt: '2026-09-11T20:24:52.989Z',
      extraMinutes: 0,
      extensions: 0,
    });
  });

  test('a resumed room keeps its extra time and extension count', () => {
    expect(roomState(monitor('extended').sitting)).toEqual({
      paused: false,
      pausedAt: null,
      extraMinutes: 5,
      extensions: 1,
    });
  });
});

describe('settings', () => {
  test('counts the ten toggles that are on, never the time limit', () => {
    expect(settingsOnCount(effectiveSettings(probe.settings))).toBe(8);
    expect(effectiveSettings(probe.settings)).toMatchObject({ lowBw: true, lockdown: false, timeLimit: 35 });
  });

  test('a never-written column reads as the defaults the server merges onto', () => {
    expect(effectiveSettings(null)).toBe(DEFAULT_SITTING_SETTINGS);
    expect(settingsOnCount(effectiveSettings(null))).toBe(8);
  });
});

describe('closeConfirmFacts', () => {
  test('names the working students and counts who never signed in', () => {
    expect(closeConfirmFacts(monitor('joined').students)).toEqual({
      working: 1,
      firstNames: ['Amara'],
      moreCount: 0,
      offline: 0,
      notJoined: 1,
    });
  });

  test('names three at most, then counts the rest', () => {
    const [amara] = monitor('joined').students;
    if (amara === undefined) throw new Error('fixture has no student');
    const five = ['Kai B.', 'Lee C.', 'Mo D.', 'Noor E.', 'Oli F.'].map((display_name) => ({ ...amara, display_name }));
    expect(closeConfirmFacts(five)).toMatchObject({ working: 5, firstNames: ['Kai', 'Lee', 'Mo'], moreCount: 2 });
  });
});

describe('controlFailure', () => {
  test('reads the 409 reason the server sent', () => {
    expect(controlFailure(refusal('alreadyPaused'))).toBe('already_paused');
    expect(controlFailure(refusal('notPaused'))).toBe('not_paused');
    expect(controlFailure(refusal('notRunning'))).toBe('not_running');
  });

  test('a 404 is an unknown sitting, a 400 a refused body, anything else a failure', () => {
    expect(controlFailure(refusal('notFound'))).toBe('not_found');
    expect(controlFailure(refusal('badMinutes'))).toBe('invalid');
    expect(controlFailure(new Error('network'))).toBe('failed');
  });
});

describe('historyRows', () => {
  const rows = historyRows(openRows, closedRows);
  const ran = closedRows.filter((row) => row.phase !== 'cancelled' && row.opened_at !== null);

  test('the live sittings lead, then the newest ran sessions, ten at most', () => {
    expect(rows.slice(0, 3).map((row) => row.isLive)).toEqual([true, true, true]);
    expect(rows).toHaveLength(3 + Math.min(10, ran.length));
    expect(rows.slice(3).every((row) => !row.isLive)).toBe(true);
  });

  test('a cancelled booking never shows as a session that ran', () => {
    const ids = new Set(rows.map((row) => row.documentId));
    for (const row of closedRows.filter((entry) => entry.phase === 'cancelled')) {
      expect(ids.has(row.sitting_document_id)).toBe(false);
    }
  });

  test('prints the served form, code, open time and completed of expected', () => {
    expect(rows[0]).toEqual({
      documentId: probe.sitting_document_id,
      test: 'Reading diagnostic — Test A',
      code: '410475',
      openedAt: '2026-09-11T20:24:52.838Z',
      completed: 0,
      expected: 2,
      isLive: true,
    });
  });

  test('is truncated when the page holds more ran sessions or the class has more pages', () => {
    expect(historyIsTruncated(closedRows, recorded.closedPage.total)).toBe(true);
    expect(historyIsTruncated(closedRows.slice(0, 1), 1)).toBe(false);
  });
});

describe('labels', () => {
  test('clock and day-month in the given zone', () => {
    expect(clockLabel('2026-09-11T20:24:52.989Z', 'en', 'UTC')).toBe('20:24');
    expect(dayMonthLabel('2026-09-11T20:24:52.838Z', 'en', 'UTC')).toBe('11 Sep');
  });
});
