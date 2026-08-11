import type { ReactNode } from 'react';

import type { DashboardClass, TestCompletion } from '@/modules/teacher/types/teacher.types';

/** The four mutually exclusive states the class-card grid can be in. */
export type TeacherDashboardStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface TeacherDashboardCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  classCount: number;
}

export interface TeacherClassCardProps {
  classCard: DashboardClass;
}

export interface TeacherClassCompletionRowProps {
  label: string;
  completion: TestCompletion;
}

export interface TeacherDashboardGateProps {
  teacher: ReactNode;
  fallback: ReactNode;
}
