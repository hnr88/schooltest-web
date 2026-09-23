import { describe, expect, test } from 'vitest';

import {
  addDaysIso,
  minutesOf,
  scheduleErrors,
  schoolTimeZone,
  windowIso,
  windowsOverlap,
  zonedParts,
  zonedWallTimeToIso,
} from '@/modules/teacher/lib/start-session-schedule';

const TODAY = '2026-09-11';
const valid = { date: '2026-09-12', opens: '09:00', closes: '09:50', timeLimit: 40, today: TODAY, nowHm: '21:00' };

describe('minutesOf', () => {
  test('reads HH:MM as minutes after midnight', () => {
    expect(minutesOf('09:30')).toBe(570);
    expect(minutesOf('19:00')).toBe(1140);
  });

  test('an empty or malformed time is NaN, never 0', () => {
    expect(minutesOf('')).toBeNaN();
    expect(minutesOf('9')).toBeNaN();
  });
});

describe('scheduleErrors (design :3575–3581)', () => {
  test('a window tomorrow inside school hours that fits the test has no errors', () => {
    expect(scheduleErrors(valid)).toEqual([]);
  });

  test('no date, or a date that has passed', () => {
    expect(scheduleErrors({ ...valid, date: '' })).toEqual([{ key: 'pickDate' }]);
    expect(scheduleErrors({ ...valid, date: '2026-09-10' })).toEqual([{ key: 'datePassed' }]);
  });

  test('the time rules are one chain: missing, outside hours, close before open, too short', () => {
    expect(scheduleErrors({ ...valid, closes: '' })).toEqual([{ key: 'setBothTimes' }]);
    expect(scheduleErrors({ ...valid, opens: '06:55' })).toEqual([{ key: 'outsideHours' }]);
    expect(scheduleErrors({ ...valid, closes: '19:05' })).toEqual([{ key: 'outsideHours' }]);
    expect(scheduleErrors({ ...valid, closes: '09:00' })).toEqual([{ key: 'closeBeforeOpen' }]);
    expect(scheduleErrors({ ...valid, closes: '09:20' })).toEqual([
      { key: 'windowShort', values: { window: 20, limit: 40 } },
    ]);
  });

  test('a start earlier today is its own rule, reported alongside the others', () => {
    expect(scheduleErrors({ ...valid, date: TODAY, opens: '08:00', closes: '08:20', nowHm: '12:00' })).toEqual([
      { key: 'windowShort', values: { window: 20, limit: 40 } },
      { key: 'earlierToday' },
    ]);
    expect(scheduleErrors({ ...valid, date: TODAY, opens: '13:00', closes: '14:00', nowHm: '12:00' })).toEqual([]);
  });

  test('the date and the time rules stack in the design order', () => {
    expect(scheduleErrors({ ...valid, date: '2026-09-01', closes: '09:10' })).toEqual([
      { key: 'datePassed' },
      { key: 'windowShort', values: { window: 10, limit: 40 } },
    ]);
  });
});

describe('school-zone wall time', () => {
  test('09:00 in the school zone becomes the right UTC instant', () => {
    expect(zonedWallTimeToIso('2026-09-14', '09:00', 'Australia/Sydney')).toBe('2026-09-13T23:00:00.000Z');
    expect(zonedWallTimeToIso('2026-09-14', '09:00', 'Europe/Bucharest')).toBe('2026-09-14T06:00:00.000Z');
    expect(zonedWallTimeToIso('2026-01-14', '09:00', 'Europe/Bucharest')).toBe('2026-01-14T07:00:00.000Z');
  });

  test('an instant reads back as the school-zone date and HH:MM', () => {
    expect(zonedParts(new Date('2026-09-13T23:00:00.000Z'), 'Australia/Sydney')).toEqual({
      date: '2026-09-14',
      time: '09:00',
    });
    expect(zonedParts(new Date('2026-09-14T06:00:00.000Z'), 'Europe/Bucharest')).toEqual({
      date: '2026-09-14',
      time: '09:00',
    });
  });

  test('addDaysIso crosses month ends', () => {
    expect(addDaysIso('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('windowsOverlap', () => {
  const at = (hm: string) => `2026-09-14T${hm}:00.000Z`;

  test('touching windows do not overlap; nested and partial ones do', () => {
    expect(windowsOverlap(at('09:00'), at('10:00'), at('10:00'), at('11:00'))).toBe(false);
    expect(windowsOverlap(at('09:00'), at('10:00'), at('09:30'), at('09:40'))).toBe(true);
    expect(windowsOverlap(at('09:00'), at('10:00'), at('08:30'), at('09:15'))).toBe(true);
  });
});

describe('BUG-002 — the window is built in the SCHOOL zone, never the device zone', () => {
  const MELBOURNE = 'Australia/Melbourne';

  test('the class zone (C-TD-1) wins over a booking echo and the device zone', () => {
    expect(schoolTimeZone(MELBOURNE, 'Australia/Perth', 'Europe/London')).toBe(MELBOURNE);
    expect(schoolTimeZone(undefined, MELBOURNE, 'Europe/London')).toBe(MELBOURNE);
    expect(schoolTimeZone(undefined, null, 'Europe/London')).toBe('Europe/London');
  });

  test('09:00–10:00 at a Melbourne school is the same instant pair whatever the device zone', () => {
    const zone = schoolTimeZone(MELBOURNE, undefined, 'Europe/London');
    expect(windowIso('2026-09-24', '09:00', '10:00', zone)).toEqual({
      opens_at: '2026-09-23T23:00:00.000Z',
      closes_at: '2026-09-24T00:00:00.000Z',
    });
    expect(schoolTimeZone(MELBOURNE, undefined, 'UTC')).toBe(zone);
  });

  test('BEFORE: built in a London device zone the same wall clock names other instants', () => {
    const london = windowIso('2026-09-24', '10:00', '11:00', 'Europe/London');
    expect(london).toEqual({ opens_at: '2026-09-24T09:00:00.000Z', closes_at: '2026-09-24T10:00:00.000Z' });
    expect(zonedParts(new Date(london?.closes_at ?? ''), MELBOURNE).time).toBe('20:00');
  });

  test('the preview reads today and now in the school zone: 06:00 there is out of hours and earlier today', () => {
    const now = zonedParts(new Date('2026-09-23T21:30:00.000Z'), MELBOURNE);
    expect(now).toEqual({ date: '2026-09-24', time: '07:30' });
    expect(zonedParts(new Date('2026-09-23T21:30:00.000Z'), 'Europe/London').date).toBe('2026-09-23');
    const base = { timeLimit: 40, today: now.date, nowHm: now.time };
    expect(scheduleErrors({ ...base, date: '2026-09-24', opens: '09:00', closes: '10:00' })).toEqual([]);
    expect(scheduleErrors({ ...base, date: '2026-09-24', opens: '06:00', closes: '07:00' })).toEqual([
      { key: 'outsideHours' },
      { key: 'earlierToday' },
    ]);
    expect(scheduleErrors({ ...base, date: '2026-09-23', opens: '09:00', closes: '10:00' })).toEqual([
      { key: 'datePassed' },
    ]);
  });

  test('Melbourne DST starts 2026-10-04: 09:00 is UTC+10 the day before and UTC+11 on the day', () => {
    expect(windowIso('2026-10-03', '09:00', '10:00', MELBOURNE)).toEqual({
      opens_at: '2026-10-02T23:00:00.000Z',
      closes_at: '2026-10-03T00:00:00.000Z',
    });
    expect(windowIso('2026-10-04', '07:00', '19:00', MELBOURNE)).toEqual({
      opens_at: '2026-10-03T20:00:00.000Z',
      closes_at: '2026-10-04T08:00:00.000Z',
    });
    expect(zonedParts(new Date('2026-10-03T20:00:00.000Z'), MELBOURNE)).toEqual({ date: '2026-10-04', time: '07:00' });
  });

  test('Melbourne DST ends 2027-04-04: 09:00 moves back to UTC+10', () => {
    expect(zonedWallTimeToIso('2027-04-03', '09:00', MELBOURNE)).toBe('2027-04-02T22:00:00.000Z');
    expect(zonedWallTimeToIso('2027-04-04', '09:00', MELBOURNE)).toBe('2027-04-03T23:00:00.000Z');
  });
});
