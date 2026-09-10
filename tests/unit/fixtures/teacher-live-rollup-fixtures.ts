import { vi } from 'vitest';

import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

/**
 * teacher/09 — constructed fixtures for the live roll-up. A populated
 * live-sessions state is structurally unproducible on the shared dev DB
 * (live `sat_count` = 0, scored students disjoint from class rosters), so the
 * populated roll-up is proven HERE, at unit level, with these fixtures — and
 * the live-empty path is recorded as honest absence with the proving query.
 */

let sequence = 0;

function nextDocumentId(prefix: string): string {
  sequence += 1;
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

export function makeClass(overrides: Partial<DashboardClass> & { name: string }): DashboardClass {
  sequence += 1;
  return {
    class_document_id: overrides.class_document_id ?? nextDocumentId('cls'),
    name: overrides.name,
    year_band: overrides.year_band ?? '7_9',
    student_count: overrides.student_count ?? 20,
    test_a: overrides.test_a ?? { completed: 0, total: 20 },
    test_b: overrides.test_b ?? { completed: 0, total: 20 },
    top_gap: overrides.top_gap ?? null,
    status: overrides.status ?? 'no_tests_yet',
    open_session_count: overrides.open_session_count ?? 0,
  };
}

export function makeSitting(
  overrides: Partial<TeacherTestSession> & {
    classDocumentId: string;
    className: string;
  },
): TeacherTestSession {
  return {
    sitting_document_id: overrides.sitting_document_id ?? nextDocumentId('sit'),
    code: overrides.code ?? 'AB12CD',
    status: overrides.status ?? 'open',
    class: {
      document_id: overrides.classDocumentId,
      name: overrides.className,
    },
    variant: overrides.variant ?? 'A',
    opened_at: overrides.opened_at ?? '2026-09-10T00:00:00.000Z',
    closed_at: overrides.closed_at ?? null,
    completed: overrides.completed ?? 3,
    expected: overrides.expected ?? 20,
  };
}

export const CLASS_ROSE = makeClass({ name: 'Rosewood', year_band: '7_9', student_count: 20 });
export const CLASS_OAK = makeClass({ name: 'Oakhurst', year_band: '10_12', student_count: 14 });
export const CLASS_PINE = makeClass({ name: 'Pinewood', year_band: '7_9', student_count: 18 });

export const SITTING_ROSE_A = makeSitting({
  classDocumentId: CLASS_ROSE.class_document_id,
  className: CLASS_ROSE.name,
  code: 'RA01AA',
  variant: 'A',
  completed: 5,
  expected: 20,
});
export const SITTING_ROSE_B = makeSitting({
  classDocumentId: CLASS_ROSE.class_document_id,
  className: CLASS_ROSE.name,
  code: 'RB02BB',
  variant: 'B',
  completed: 2,
  expected: 20,
});
export const SITTING_OAK_A = makeSitting({
  classDocumentId: CLASS_OAK.class_document_id,
  className: CLASS_OAK.name,
  code: 'OA03CC',
  variant: 'A',
  completed: 0,
  expected: 14,
});

/* ── query stubs (moved here to keep the spec file under the 200-line cap) ── */

export interface QueryStub {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function makeQueryStubs(): {
  sessions: QueryStub;
  dashboard: QueryStub;
  tests: QueryStub;
  close: { isPending: boolean; mutate: () => void };
} {
  return {
    sessions: { data: undefined, isPending: true, isError: false, isFetching: false, error: null, refetch: vi.fn() },
    dashboard: { data: undefined, isPending: true, isError: false, isFetching: false, error: null, refetch: vi.fn() },
    tests: {
      data: { tests: [{ form_document_id: 'f1', variant: 'A', label: 'Reading diagnostic — Test A', skill: 'reading' }] },
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    },
    close: { isPending: false, mutate: vi.fn() },
  };
}
