import type { ClassSitting } from '@/modules/test-day';

// The class's latest reading sitting: the teacher-scoped sittings list is newest first
// (`useClassSittingsQuery`, sort createdAt:desc), so it is the first reading row.
export function latestReadingSitting(sittings: readonly ClassSitting[]): ClassSitting | null {
  return sittings.find((sitting) => sitting.skill === 'reading') ?? null;
}
