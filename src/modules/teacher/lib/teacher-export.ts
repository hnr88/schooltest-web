import { isAxiosError } from 'axios';

import { TEACHER_EXPORT_DISPOSITION_PATTERN } from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportFailure, TeacherExportRequest } from '@/modules/teacher/types/teacher-export.types';

/** The API's `details.code` on an export it withheld at de-identification. */
const EXPORT_WITHHELD_CODE = 'EXPORT_WITHHELD';

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

/** `error.details.code` of a Strapi envelope; the export asks for text, so the body may be a JSON string. */
function envelopeCode(data: unknown): unknown {
  let envelope: unknown = data;
  if (typeof data === 'string') {
    try {
      envelope = JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  return (envelope as { error?: { details?: { code?: unknown } } } | null)?.error?.details?.code;
}

/** Why the export GET produced no file (see `TeacherExportFailure`). */
export function classifyTeacherExportFailure(error: unknown): TeacherExportFailure {
  if (!isAxiosError(error) || error.response === undefined) return 'failed';
  if (envelopeCode(error.response.data) === EXPORT_WITHHELD_CODE) return 'withheld';
  const { status } = error.response;
  return status >= 400 && status < 500 && status !== 401 && status !== 429 ? 'refused' : 'failed';
}

/** A failed outcome rethrown on the client, so every mutation consumer keeps its catch / isError path. */
export class TeacherExportError extends Error {
  readonly failure: TeacherExportFailure;

  constructor(failure: TeacherExportFailure) {
    super(`teacher export ${failure}`);
    this.name = 'TeacherExportError';
    this.failure = failure;
  }
}

export function teacherExportFailureOf(error: unknown): TeacherExportFailure {
  return error instanceof TeacherExportError ? error.failure : 'failed';
}
