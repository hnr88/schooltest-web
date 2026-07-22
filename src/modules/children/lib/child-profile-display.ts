import { getStudentDisplayName } from '@/lib/student-name';
import type {
  ChildProgressResult,
  ChildProgressStudent,
} from '@/modules/children/types/children.types';

export function getChildProfileName(student: ChildProgressStudent, fallback: string): string {
  return getStudentDisplayName(student, fallback);
}

export function getChildResultTitle(result: ChildProgressResult, fallback: string): string {
  return result.displayLabel ?? fallback;
}
