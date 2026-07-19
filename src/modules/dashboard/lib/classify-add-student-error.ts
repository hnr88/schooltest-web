import { isAxiosError } from 'axios';

import type {
  AddStudentErrorState,
  StrapiErrorPayload,
} from '@/modules/dashboard/types/add-student.types';

// C-STUDENT-CREATE: a 400 carries CONTRACTS.md's typed { error: { message,
// details: { issues } } } envelope — surfaced verbatim (the specific field/rule
// that failed) instead of a single generic string. No response at all means
// offline (the shared offline-error model); anything else is an unexpected
// server fault.
export function classifyAddStudentError(error: unknown): AddStudentErrorState {
  if (isAxiosError<StrapiErrorPayload>(error)) {
    if (error.response === undefined) return { kind: 'offline' };
    if (error.response.status === 400) {
      const details = error.response.data?.error?.details;
      const message =
        details?.issues && details.issues.length > 0
          ? details.issues.join(' ')
          : error.response.data?.error?.message;
      return { kind: 'validation', message };
    }
  }
  return { kind: 'server' };
}
