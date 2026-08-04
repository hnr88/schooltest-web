export type ChildErrorKind = 'seatCap' | 'schoolInactive' | 'forbidden' | 'generic';

export interface StrapiErrorEnvelope {
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: { code?: string };
  };
}
