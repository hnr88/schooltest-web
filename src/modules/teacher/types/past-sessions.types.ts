import type { DirectoryQueryStatus } from '@/modules/directory';

import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

export type PastSessionsStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface PastSessionsReadCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  sessionCount: number;
}

/**
 * ops/34 — the list renders through the directory kit, so the panel hands over
 * the raw reads PLUS the composed query status the kit's state machine reads.
 */
export interface PastSessionsTableProps {
  sessions: readonly TeacherTestSession[];
  tests: readonly TeacherTest[];
  queryStatus: DirectoryQueryStatus;
}

export interface SessionMissingValueProps {
  label: string;
}
