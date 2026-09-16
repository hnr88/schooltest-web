import { isAxiosError } from 'axios';

import type { StudentErrorKind, StrapiErrorEnvelope } from '@/modules/school-students/types/lib.types';

export function classifyStudentError(error: unknown): StudentErrorKind {
  if (!isAxiosError(error)) {
    return 'generic';
  }
  const status = error.response?.status;
  const envelope = error.response?.data as StrapiErrorEnvelope | undefined;
  const code = envelope?.error?.details?.code;
  // D9: a refused duplicate-email create is field data, not a permission
  // failure. `EMAIL_TAKEN` is the provisioning middleware's 400 for a
  // duplicate the email gate missed; `EMAIL_IN_USE` is the email gate's own
  // 400 for the same condition — both read as the one email-in-use message.
  // Matched by code before the status checks so the envelope, not the HTTP
  // status, decides.
  if (code === 'EMAIL_TAKEN' || code === 'EMAIL_IN_USE') {
    return 'emailInUse';
  }
  if (status === 403 && code === 'SEAT_CAP') {
    return 'seatCap';
  }
  if (status === 403 && code === 'SCHOOL_INACTIVE') {
    return 'schoolInactive';
  }
  if (status === 403) {
    return 'forbidden';
  }
  return 'generic';
}
