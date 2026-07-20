import { isAxiosError } from 'axios';

import type {
  WizardSubmitError,
  WizardSubmitErrorPayload,
} from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD submit errors (mirrors classify-add-student-error): no
// response ⇒ offline; 400 ⇒ generic validation alert (server re-validation) with
// the typed { error.details.issues } surfaced as an optional detail; 403 (grant
// regression) and any other status ⇒ server fault.
export function classifyWizardError(error: unknown): WizardSubmitError {
  if (isAxiosError<WizardSubmitErrorPayload>(error)) {
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
