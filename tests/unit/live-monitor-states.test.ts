import { describe, expect, test } from 'vitest';

import {
  MONITOR_STATE_ORDER,
  MONITOR_SUMMARY_ORDER,
} from '@/modules/teacher/constants/live-monitor.constants';
import { monitorSummaryItems, sortMonitorStudents } from '@/modules/teacher/lib/live-monitor';
import {
  connectionStateSchema,
  monitorStateSchema,
} from '@/modules/teacher/schemas/teacher.schema';
import {
  monitorStudentSchema,
  monitorSummarySchema,
} from '@/modules/teacher/schemas/teacher-session.schema';

// teacher/12 — ONE monitor vocabulary of eight across both reads, widened
// mirror-first. The literal six below is the PRE-widening enum, kept here on
// purpose: the Done-when bullet requires proving both directions of the
// ordering rule against it, so the old mirror's exact membership is asserted
// from the test, never derived from the code under test.
const PRE_WIDENING_STATES = [
  'not_joined',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
] as const;

const NEW_STATES = ['absent', 'paused'] as const;

function tile(state: string, over: Record<string, unknown> = {}) {
  // documentId-compatible: the mirror enforces Strapi's 24-char [a-z0-9] id.
  const id = (state.replace(/_/g, 'a') + '0'.repeat(24)).slice(0, 24);
  return {
    student_document_id: id,
    display_name: `Student ${state}`,
    state,
    stage: null,
    total_stages: null,
    inactive_minutes: null,
    proctoring: null,
    ...over,
  };
}

describe('teacher/12 — the eight-state monitor vocabulary', () => {
  test('the schema enum carries exactly the six plus absent and paused', () => {
    expect([...monitorStateSchema.options].sort()).toEqual(
      [...PRE_WIDENING_STATES, ...NEW_STATES].sort(),
    );
  });

  test('the widened enum accepts every new member and still rejects a foreign one', () => {
    for (const state of NEW_STATES) expect(monitorStateSchema.safeParse(state).success).toBe(true);
    expect(monitorStateSchema.safeParse('escaped').success).toBe(false);
  });

  test('MONITOR_STATE_ORDER carries all eight with scoring_failed still leading', () => {
    expect([...MONITOR_STATE_ORDER].sort()).toEqual([...monitorStateSchema.options].sort());
    expect(MONITOR_STATE_ORDER[0]).toBe('scoring_failed');
  });

  test('sortMonitorStudents never sees an unlisted member — no -1, no accidental lead', () => {
    const roster = [...monitorStateSchema.options].map((state, i) =>
      tile(state, { display_name: `Student ${i}` }),
    );
    const sorted = sortMonitorStudents(roster as never);
    expect(sorted[0]?.state).toBe('scoring_failed');
    for (const student of sorted) {
      expect(MONITOR_STATE_ORDER.indexOf(student.state)).toBeGreaterThanOrEqual(0);
    }
  });

  test('paused sorts beside stalled and absent beside the neutral group', () => {
    const paused = MONITOR_STATE_ORDER.indexOf('paused');
    const stalled = MONITOR_STATE_ORDER.indexOf('stalled');
    const absent = MONITOR_STATE_ORDER.indexOf('absent');
    const joined = MONITOR_STATE_ORDER.indexOf('joined');
    expect(Math.abs(paused - stalled)).toBe(1);
    expect(Math.abs(absent - joined)).toBe(1);
  });

  test('MIRROR-FIRST: a payload emitted before the server half still parses', () => {
    // Six-state tile WITHOUT absent/paused/connection — yesterday's wire.
    const legacy = tile('in_progress');
    expect(monitorStudentSchema.safeParse(legacy).success).toBe(true);
    // Six-partition summary WITHOUT the two new counters.
    const legacySummary = {
      expected: 3,
      joined: 1,
      in_progress: 1,
      submitted: 0,
      stalled: 0,
      scoring_failed: 1,
    };
    expect(monitorSummarySchema.safeParse(legacySummary).success).toBe(true);
    // ...and the missing counters coalesce to 0 on the stat tiles.
    expect(
      monitorSummaryItems(monitorSummarySchema.parse(legacySummary)).find(
        (item) => item.key === 'absent',
      )?.value,
    ).toBe(0);
  });

  test('the new members sit OUTSIDE the pre-widening vocabulary yet parse on the widened mirror', () => {
    const legacyStates = new Set<string>(PRE_WIDENING_STATES);
    for (const state of NEW_STATES) {
      expect(legacyStates.has(state)).toBe(false);
      expect(
        monitorStudentSchema.safeParse(tile(state, { absent: false, paused: false, connection: null }))
          .success,
      ).toBe(true);
    }
    expect(connectionStateSchema.safeParse('online').success).toBe(true);
    expect(connectionStateSchema.safeParse('satellite').success).toBe(false);
  });

  test('connection is nullable and only ever one of the three labels', () => {
    expect(connectionStateSchema.safeParse(null).success).toBe(true);
    for (const label of ['online', 'weak', 'offline'] as const) {
      expect(connectionStateSchema.safeParse(label).success).toBe(true);
    }
  });

  test('the summary order carries the two new counters after scoring_failed', () => {
    expect(MONITOR_SUMMARY_ORDER.slice(-2)).toEqual(['absent', 'paused']);
    expect(MONITOR_SUMMARY_ORDER).toHaveLength(8);
  });
});
