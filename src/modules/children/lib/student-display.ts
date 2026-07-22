import type { StatusPillTone } from '@/modules/design-system';
import type { StatusMeta, TargetEntrySource } from '@/modules/children/types/children.types';

// Canonical roster pill tones: green for a live profile, blue for an enrolled
// one, neutral grey once archived.
const STATUS_TONES: Record<string, StatusPillTone> = {
  active: 'success',
  archived: 'neutral',
  enrolled: 'info',
};

export function getStatusTone(status: string | null | undefined): StatusPillTone {
  return (status && STATUS_TONES[status]) || 'neutral';
}

// C-UI-MYCHILDREN §6 status pills — light-bg token pairs (uppercased at render).
const STATUS_META: Record<string, StatusMeta> = {
  active: {
    labelKey: 'statusActive',
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  },
  archived: {
    labelKey: 'statusArchived',
    className: 'bg-muted text-foreground',
  },
  enrolled: {
    labelKey: 'statusEnrolled',
    className: 'bg-blue-50 text-navy-800 dark:bg-blue-950 dark:text-blue-300',
  },
};

const FALLBACK_STATUS: StatusMeta = {
  labelKey: 'statusActive',
  className: 'bg-muted text-foreground',
};

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
