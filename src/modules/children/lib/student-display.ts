import type { StatusPillTone } from '@/modules/design-system';
import type { StatusMeta, TargetEntrySource } from '@/modules/children/types/children.types';
import { FALLBACK_STATUS, STATUS_META, STATUS_TONES } from '@/modules/children/constants/lib.constants';

export function getStatusTone(status: string | null | undefined): StatusPillTone {
  return (status && STATUS_TONES[status]) || 'neutral';
}

export function getStatusMeta(status: string | null | undefined): StatusMeta {
  return (status && STATUS_META[status]) || FALLBACK_STATUS;
}

// Target-entry column: "{target_entry_year} · {target_entry_term}" (year alone
// if the term is missing; null when there is no year at all).
export function getTargetEntry(student: TargetEntrySource): string | null {
  if (!student.target_entry_year) {
    return null;
  }
  return student.target_entry_term
    ? `${student.target_entry_year} · ${student.target_entry_term}`
    : student.target_entry_year;
}
