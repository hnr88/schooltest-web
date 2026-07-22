import { getStudentDisplayName } from '@/lib/student-name';
import type {
  ChildProgressResult,
  ChildProgressStudent,
  ResultBadgeVariant,
} from '@/modules/children/types/children.types';

const RESULT_BADGE_VARIANTS: Record<ChildProgressResult['status'], ResultBadgeVariant> = {
  scoring: 'warning',
  partial_pending: 'accent',
  complete: 'success',
};

export function getChildProfileName(student: ChildProgressStudent, fallback: string): string {
  return getStudentDisplayName(student, fallback);
}

export function getChildProfileYear(student: ChildProgressStudent, fallback: string): string {
  return student.current_year_level ?? student.year_level?.toString() ?? fallback;
}

export function getChildProfileTarget(student: ChildProgressStudent, fallback: string): string {
  if (!student.target_entry_year) return fallback;
  return student.target_entry_term
    ? `${student.target_entry_year} · ${student.target_entry_term}`
    : student.target_entry_year;
}

export function getChildResultTitle(result: ChildProgressResult, fallback: string): string {
  return result.displayLabel ?? fallback;
}

export function getResultBadgeVariant(status: ChildProgressResult['status']): ResultBadgeVariant {
  return RESULT_BADGE_VARIANTS[status];
}
