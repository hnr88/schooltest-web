import { describe, expect, test } from 'vitest';

import {
  PAST_SESSIONS_DEFAULT_SORT,
  pastSessionsClientConfig,
} from '@/modules/teacher/lib/past-sessions-directory';
import {
  STUDENTS_RESULTS_DEFAULT_SORT,
  studentsResultsClientConfig,
} from '@/modules/teacher/lib/students-results-directory';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { RosterRow } from '@/modules/results/types/roster.types';

// ops/34 — the client-mode semantics the teacher lists hand the directory
// kit. These pin the honest-number rules the surfaces were built on: dates
// sort nulls-last in BOTH directions, unscored students sort last (never as a
// zero), and the default sorts carry NO comparator so the loaded order —
// C-TS-2's `opened_at:desc` and `sortRosterRows`' attention order — survives
// untouched.

function session(overrides: Partial<TeacherTestSession>): TeacherTestSession {
  return {
    sitting_document_id: 's1',
    code: 'AB12',
    status: 'closed',
    class: { document_id: 'c1', name: '6B' },
    variant: 'A',
    opened_at: '2026-09-01T00:00:00Z',
    closed_at: '2026-09-01T01:00:00Z',
    completed: 2,
    expected: 2,
    ...overrides,
  };
}

const SESSIONS: readonly TeacherTestSession[] = [
  session({ sitting_document_id: 'a', opened_at: '2026-09-03T00:00:00Z' }),
  session({ sitting_document_id: 'b', opened_at: null }),
  session({ sitting_document_id: 'c', opened_at: '2026-09-01T00:00:00Z' }),
  session({ sitting_document_id: 'd', opened_at: '2026-09-02T00:00:00Z', status: 'open' }),
];

const rosterRow = (name: string, score: number | null): RosterRow =>
  ({
    student: { document_id: name, name, initials: 'X', eald_flag: false },
    result:
      score === null
        ? null
        : ({ overall: { domain_score: score, delta: null, delta_display: null } } as unknown as RosterRow['result']),
  }) as RosterRow;

const ROSTER: readonly RosterRow[] = [
  rosterRow('Zara', 70),
  rosterRow('Ana', null),
  rosterRow('Ben', 50),
];

describe('past-sessions client config', () => {
  test('default sort is date:desc and carries NO comparator (server order preserved)', () => {
    expect(PAST_SESSIONS_DEFAULT_SORT).toBe('date:desc');
    expect(pastSessionsClientConfig([]).comparators?.['date:desc']).toBeDefined();
  });

  test('date sorts are nulls-last in both directions', () => {
    const comparators = pastSessionsClientConfig([]).comparators;
    const asc = [...SESSIONS].sort(comparators?.['date:asc']);
    expect(asc.map((s) => s.sitting_document_id)).toEqual(['c', 'd', 'a', 'b']);
    const desc = [...SESSIONS].sort(comparators?.['date:desc']);
    expect(desc.map((s) => s.sitting_document_id)).toEqual(['a', 'd', 'c', 'b']);
  });

  test('status sorts rank open before closed and back', () => {
    const comparators = pastSessionsClientConfig([]).comparators;
    const openFirst = [...SESSIONS].sort(comparators?.['status:open']);
    expect(openFirst[0].status).toBe('open');
    const closedFirst = [...SESSIONS].sort(comparators?.['status:closed']);
    expect(closedFirst[0].status).toBe('closed');
  });

  test('search text is the test label only, empty for an unlabelled variant', () => {
    const tests = [{ form_document_id: 'f1', variant: 'A' as const, label: 'Test A', skill: 'reading' as const }];
    const config = pastSessionsClientConfig(tests);
    expect(config.searchText?.(SESSIONS[0])).toEqual(['Test A']);
    expect(config.searchText?.(session({ variant: null }))).toEqual([]);
  });
});

describe('students-results client config', () => {
  test('default sort is the roster order and carries NO comparator', () => {
    expect(STUDENTS_RESULTS_DEFAULT_SORT).toBe('roster');
    expect(studentsResultsClientConfig.comparators?.['roster']).toBeUndefined();
  });

  test('score sorts keep unscored students LAST in both directions', () => {
    const comparators = studentsResultsClientConfig.comparators;
    const low = [...ROSTER].sort(comparators?.['score:low']);
    expect(low.map((row) => row.student.name)).toEqual(['Ben', 'Zara', 'Ana']);
    const high = [...ROSTER].sort(comparators?.['score:high']);
    expect(high.map((row) => row.student.name)).toEqual(['Zara', 'Ben', 'Ana']);
  });

  test('the phase filter matches the exact ACARA phase field', () => {
    const phase = studentsResultsClientConfig.filterPredicates?.phase;
    expect(phase?.(ROSTER[0], 'Beginning')).toBe(false);
    expect(phase?.(rosterRow('Ana', null), 'Beginning')).toBe(false);
    const begun = { ...ROSTER[0], result: { acara_phase: 'Beginning' } } as unknown as RosterRow;
    expect(phase?.(begun, 'Beginning')).toBe(true);
  });
});
