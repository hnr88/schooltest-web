export type ConsentErrorKind =
  | 'disabled'
  | 'notFound'
  | 'alreadyWithdrawn'
  | 'guardianRequired'
  | 'generic';

export interface ConsentErrorEnvelope {
  error?: {
    status?: number;
    details?: { code?: string };
  };
}
