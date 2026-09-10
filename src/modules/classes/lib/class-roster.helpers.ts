import { studentDisplayName } from '@/modules/classes/lib/class-detail.helpers';
import type { ClassDetailTeacher } from '@/modules/classes/types/class-detail.types';

export const EMPTY_TEACHER_LIST_SUPPORTED = true;

export function unionTeacherIds(
  current: ClassDetailTeacher | null,
  picked: readonly string[],
): string[] {
  const ids = current ? [current.documentId] : [];
  for (const id of picked) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function withoutTeacherId(
  current: ClassDetailTeacher | null,
  teacherDocumentId: string,
): string[] {
  if (!current || current.documentId === teacherDocumentId) return [];
  return [current.documentId];
}

export function removalAllowed(nextTeacherIds: readonly string[]): boolean {
  return nextTeacherIds.length > 0 || EMPTY_TEACHER_LIST_SUPPORTED;
}

export function studentsNotInClass<Row extends { documentId: string }>(
  candidates: readonly Row[],
  roster: readonly { documentId: string }[],
): Row[] {
  const assigned = new Set(roster.map((student) => student.documentId));
  return candidates.filter((student) => !assigned.has(student.documentId));
}

export function matchesStudentSearch(
  student: { given_name: string | null; family_name: string | null },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') return true;
  return studentDisplayName(student).toLowerCase().includes(needle);
}
