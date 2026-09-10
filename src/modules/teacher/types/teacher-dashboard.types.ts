import type { TestCompletion } from '@/modules/teacher/types/teacher.types';

export type TeacherDashboardStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface TeacherDashboardCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  classCount: number;
}

export interface TeacherClassCompletionRowProps {
  label: string;
  completion: TestCompletion;
}
