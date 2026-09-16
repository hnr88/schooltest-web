export type StudentErrorKind = 'seatCap' | 'schoolInactive' | 'forbidden' | 'generic' | 'emailInUse';

export interface StrapiErrorEnvelope {
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: { code?: string };
  };
}
