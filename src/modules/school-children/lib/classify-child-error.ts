import { isAxiosError } from 'axios';

// Maps a failed C-CHD call onto the copy keys the form/row actions show. The
// 403 contract states ride in error.details.code (the seat gate rethrows as a
// PolicyError so the identifiers survive the compose-endpoint middleware):
// SEAT_CAP carries the contracted "Contact SchoolTest to add seats" message,
// SCHOOL_INACTIVE means the school account is not active. Any other 403 is a
// plain permission failure; everything else is generic.

export type ChildErrorKind = 'seatCap' | 'schoolInactive' | 'forbidden' | 'generic';

interface StrapiErrorEnvelope {
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: { code?: string };
  };
}

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
