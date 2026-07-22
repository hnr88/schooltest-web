import type { StatusPillTone } from '@/modules/design-system';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

const RESULT_STATUS_TONES: Record<ChildProgressResult['status'], StatusPillTone> = {
  scoring: 'warning',
  partial_pending: 'info',
  complete: 'success',
};

export function getResultStatusTone(status: ChildProgressResult['status']): StatusPillTone {
  return RESULT_STATUS_TONES[status];
}

// Skill chips are built from the data, never from the enum: a filter that can
// return an empty panel is worse than no filter at all.
export function getResultSkills(results: ChildProgressResult[]): string[] {
  return [...new Set(results.map((result) => result.skill).filter((skill) => skill !== null))];
}

export function filterResultsBySkill(
  results: ChildProgressResult[],
  skill: string,
): ChildProgressResult[] {
  return skill === 'all' ? results : results.filter((result) => result.skill === skill);
}
