import type { SchoolClass } from '@/modules/classes/types/classes.types';

export interface StrapiErrorEnvelope {
  error?: { message?: string };
}

export type ClassFormTarget = { mode: 'create' } | { mode: 'edit'; schoolClass: SchoolClass };
