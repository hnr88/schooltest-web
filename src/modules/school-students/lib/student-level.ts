import { ACARA_PHASE_OPTIONS, FIRST_LANGUAGE_OPTIONS } from '@/modules/school-students/constants/student-picklists.constants';
import type { AcaraPhase, FirstLanguage } from '@/modules/school-students/types/constants.types';
import type {
  SchoolStudent,
  SchoolStudentLevelFilter,
} from '@/modules/school-students/types/school-students.types';

// The roster reads two picklist columns back off the wire. Both narrow through
// the same contract lists the form writes with, so an unrecognised value shows
// as "not set" instead of reaching t() with a key that does not exist.

export function toAcaraPhase(value: string | null): AcaraPhase | null {
  return ACARA_PHASE_OPTIONS.find((phase) => phase === value) ?? null;
}

export function toFirstLanguage(value: string | null): FirstLanguage | null {
  return FIRST_LANGUAGE_OPTIONS.find((language) => language === value) ?? null;
}

// The Level filter narrows the rows the roster query already returned: the
// C-CHD-01 contract has no level query param, so this composes on top of the
// server-side name search and class filter rather than replacing them.
export function filterStudentsByLevel(
  rows: SchoolStudent[],
  level: SchoolStudentLevelFilter,
): SchoolStudent[] {
  if (level === 'all') {
    return rows;
  }
  return rows.filter((row) => toAcaraPhase(row.acara_phase) === level);
}
