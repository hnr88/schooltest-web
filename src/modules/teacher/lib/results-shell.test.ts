import { describe, expect, test } from 'vitest';

import {
  readClassDetailParams,
  resolveResultsTab,
  resolveSkillScope,
  switchClassHref,
  withClassDetailParam,
} from '@/modules/teacher/lib/results-shell';

// The class detail's URL state (`?tab=&skill=&session=`). The sitting id and the
// class id are the live ones t2 sees on GET /api/teacher/dashboard.
const CLASS_ID = 'qves8wrtl7r9ctw49jivm8gl';
const SITTING_ID = 'udi8k0wp2ovbrcen9mgy790z';

describe('resolveResultsTab', () => {
  test('keeps every tab of the closed set', () => {
    for (const tab of ['students', 'progress', 'insights', 'exit', 'reports', 'live'] as const) {
      expect(resolveResultsTab(tab)).toBe(tab);
    }
  });

  test('maps the design key "results" to the Students tab', () => {
    expect(resolveResultsTab('results')).toBe('students');
  });

  test('falls back to Students when the param is absent or unknown', () => {
    expect(resolveResultsTab(null)).toBe('students');
    expect(resolveResultsTab('')).toBe('students');
    expect(resolveResultsTab('toString')).toBe('students');
  });
});

describe('resolveSkillScope', () => {
  test('keeps the four skills and falls back to Reading', () => {
    expect(resolveSkillScope('listening')).toBe('listening');
    expect(resolveSkillScope('speaking')).toBe('speaking');
    expect(resolveSkillScope(null)).toBe('reading');
    expect(resolveSkillScope('maths')).toBe('reading');
  });
});

describe('readClassDetailParams', () => {
  test('reads the Monitor link the Classes live strip builds', () => {
    const params = new URLSearchParams(`tab=live&session=${SITTING_ID}`);
    expect(readClassDetailParams(params)).toEqual({
      tab: 'live',
      skill: 'reading',
      session: SITTING_ID,
    });
  });

  test('an empty session param is no sitting', () => {
    expect(readClassDetailParams(new URLSearchParams('session=')).session).toBeNull();
  });
});

describe('withClassDetailParam', () => {
  test('sets the tab and keeps the sitting and table params', () => {
    const params = new URLSearchParams(`session=${SITTING_ID}&q=ali`);
    expect(withClassDetailParam(params, { tab: 'progress' })).toBe(
      `session=${SITTING_ID}&q=ali&tab=progress`,
    );
  });

  test('drops a default value instead of writing it', () => {
    const params = new URLSearchParams('tab=exit&skill=writing');
    expect(withClassDetailParam(params, { tab: 'students' })).toBe('skill=writing');
    expect(withClassDetailParam(params, { skill: 'reading' })).toBe('tab=exit');
  });

  test('a non-reading skill keeps the tab, so Reading restores it', () => {
    const params = new URLSearchParams('tab=insights');
    expect(withClassDetailParam(params, { skill: 'listening' })).toBe('tab=insights&skill=listening');
  });
});

describe('switchClassHref', () => {
  test('keeps the tab and skill, drops the sitting of the class being left', () => {
    expect(
      switchClassHref(CLASS_ID, { tab: 'progress', skill: 'writing', session: SITTING_ID }),
    ).toBe(`/dashboard/results/${CLASS_ID}?tab=progress&skill=writing`);
  });

  test('the default tab and skill give the bare class route', () => {
    expect(switchClassHref(CLASS_ID, { tab: 'students', skill: 'reading', session: null })).toBe(
      `/dashboard/results/${CLASS_ID}`,
    );
  });
});
