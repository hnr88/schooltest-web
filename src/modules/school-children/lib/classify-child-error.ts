import { isAxiosError } from 'axios';

import type { ChildErrorKind, StrapiErrorEnvelope } from '@/modules/school-children/types/lib.types';

export function classifyChildError(error: unknown): ChildErrorKind {
  if (!isAxiosError(error)) {
    return 'generic';
  }
  const status = error.response?.status;
  const envelope = error.response?.data as StrapiErrorEnvelope | undefined;
  const code = envelope?.error?.details?.code;
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
