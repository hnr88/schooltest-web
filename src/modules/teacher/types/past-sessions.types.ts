import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

export type PastSessionsStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface PastSessionsReadCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  sessionCount: number;
}

export interface PastSessionsTableProps {
  sessions: readonly TeacherTestSession[];
  tests: readonly TeacherTest[];
}

export interface PastSessionRowProps {
  session: TeacherTestSession;
  testLabel: string | null;
}

export interface SessionMissingValueProps {
  label: string;
}
