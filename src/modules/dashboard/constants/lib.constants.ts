import type { ReadinessFieldKey } from '@/modules/dashboard/types/dashboard-overview.types';

export const DAY_IN_MS = 86_400_000;

export const READINESS_FIELD_KEYS: readonly ReadinessFieldKey[] = [
  'familyName',
  'email',
  'nationality',
  'yearLevel',
  'entryYear',
  'entryTerm',
];
