import { describe, expect, test } from 'vitest';

import fixture from '@/modules/teacher/lib/__fixtures__/start-session.t2.json';
import { lastSessionAt, latestAverage, sectionSummary } from '@/modules/teacher/lib/start-session-view';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import {
  DEFAULT_SITTING_SETTINGS,
  teacherTestSessionsResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';

const closed = teacherTestSessionsResponseSchema.parse(fixture.closed).sessions;
const dashboard = teacherDashboardResponseSchema.parse(fixture.dashboard);

describe('section summaries (design `mSecDuring` … `mSecTiming`)', () => {
  test('the defaults read "3 of 3 on", "1 of 2 on", "Locked down", "40 min · auto-submit"', () => {
    expect(sectionSummary('during', DEFAULT_SITTING_SETTINGS)).toEqual({ key: 'onOf', values: { on: 3, total: 3 } });
    expect(sectionSummary('access', DEFAULT_SITTING_SETTINGS)).toEqual({ key: 'onOf', values: { on: 1, total: 2 } });
    expect(sectionSummary('security', DEFAULT_SITTING_SETTINGS)).toEqual({ key: 'lockedDown', values: {} });
    expect(sectionSummary('timing', DEFAULT_SITTING_SETTINGS)).toEqual({ key: 'timingAuto', values: { limit: 40 } });
  });

  test('test conditions and timing follow their switches', () => {
    const open = { ...DEFAULT_SITTING_SETTINGS, lockdown: false };
    expect(sectionSummary('security', open).key).toBe('openFlagged');
    expect(sectionSummary('security', { ...open, focusFlag: false }).key).toBe('open');
    expect(sectionSummary('timing', { ...DEFAULT_SITTING_SETTINGS, autoSubmit: false, timeLimit: 30 })).toEqual({
      key: 'timingWaits',
      values: { limit: 30 },
    });
  });
});

describe('facts (design `mFacts`)', () => {
  test('latest average is the dashboard reading average, rounded; none is null', () => {
    const [klass] = dashboard.classes;
    expect(latestAverage(klass)).toBe(Math.round(klass.reading?.average ?? Number.NaN));
    expect(latestAverage({ ...klass, reading: { average: null, delta: null, scored: 0 } })).toBeNull();
    expect(latestAverage(undefined)).toBeNull();
  });

  test('last session is the newest sitting that actually ran; a cancelled booking is not one', () => {
    const newest = closed.map((row) => row.opened_at).filter((at): at is string => at !== null).sort().at(-1);
    expect(lastSessionAt(closed)).toBe(newest);
    const cancelled = { ...closed[0], phase: 'cancelled' as const, opened_at: '2099-01-01T00:00:00.000Z' };
    expect(lastSessionAt([cancelled, ...closed])).toBe(newest);
    expect(lastSessionAt([])).toBeNull();
  });
});
