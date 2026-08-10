import { TEACHER_EXPORT_DISPOSITION_PATTERN } from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportRequest } from '@/modules/teacher/types/teacher-export.types';

/** The one place the three C-TR-5/6/7 route shapes are written. */
export function teacherExportPath(request: TeacherExportRequest): string {
  const base = `/api/teacher/classes/${request.classDocumentId}`;
  if (request.kind === 'student') {
    return `${base}/students/${request.studentDocumentId}/export`;
  }
  return `${base}/export/${request.kind}`;
}

/**
 * The download filename is the SERVER's, taken from `Content-Disposition`. A
 * header that does not match the contract throws: there is no locally invented
 * fallback name, because a silently renamed export would hide a transport
 * regression instead of surfacing it.
 */
export function parseTeacherExportFilename(disposition: string): string {
  const match = TEACHER_EXPORT_DISPOSITION_PATTERN.exec(disposition);
  if (!match?.[1]) {
    throw new Error(`Unexpected teacher export Content-Disposition: ${disposition}`);
  }
  return match[1];
}
