import type { DirectoryClientConfig } from '@/modules/directory';

import { findTestLabel } from '@/modules/teacher/lib/join-code';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

/**
 * ops/34 — the `client`-mode behaviour the past-sessions list hands the
 * directory kit (D-KIT-MODE): what `q` matches (the test's label — the title a
 * teacher knows), and what each sort value orders by. The kit owns the
 * toolbar, states and pager; this file owns only the semantics the server
 * would have applied.
 */

export const PAST_SESSIONS_DEFAULT_SORT = 'date:desc';

export const PAST_SESSIONS_SORT_VALUES = [
  'date:desc',
  'date:asc',
  'status:open',
  'status:closed',
] as const;

/** Date ordering is opened_at, with NULLS LAST in BOTH directions — a sitting whose start was never recorded never hides at the top. */
function compareOpened(a: TeacherTestSession, b: TeacherTestSession, direction: 1 | -1): number {
  const aMs = a.opened_at === null ? null : Date.parse(a.opened_at);
  const bMs = b.opened_at === null ? null : Date.parse(b.opened_at);
  if (aMs === null && bMs === null) return 0;
  if (aMs === null) return 1;
  if (bMs === null) return -1;
  return (aMs - bMs) * direction;
}

const statusRank = (status: TeacherTestSession['status']): 0 | 1 => (status === 'open' ? 0 : 1);

/** The row's searchable text: the test's label, or nothing when C-TD-2 names no variant. */
function searchText(tests: readonly TeacherTest[]) {
  return (session: TeacherTestSession): readonly string[] => {
    const label = findTestLabel(tests, session.variant);
    return label === null ? [] : [label];
  };
}

export function pastSessionsClientConfig(
  tests: readonly TeacherTest[],
): DirectoryClientConfig<TeacherTestSession> {
  return {
    searchText: searchText(tests),
    comparators: {
      'date:asc': (a, b) => compareOpened(a, b, 1),
      'date:desc': (a, b) => compareOpened(a, b, -1),
      'status:open': (a, b) => statusRank(a.status) - statusRank(b.status),
      'status:closed': (a, b) => statusRank(b.status) - statusRank(a.status),
    },
  };
}
