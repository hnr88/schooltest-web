import {
  ACARA_PHASE_OPTIONS,
  DEFAULT_DIAGNOSTIC_STATUS,
  DIAGNOSTIC_STATUS_OPTIONS,
  FIRST_LANGUAGE_OPTIONS,
} from '@/modules/school-students/constants/student-picklists.constants';
import type {
  AcaraPhase,
  DiagnosticStatus,
  FirstLanguage,
} from '@/modules/school-students/types/constants.types';

// The roster reads three picklist columns back off the wire. All narrow through
// the same contract lists the API answers with, so an unrecognised value shows
// as "not set" instead of reaching t() with a key that does not exist.

export function toAcaraPhase(value: string | null): AcaraPhase | null {
  return ACARA_PHASE_OPTIONS.find((phase) => phase === value) ?? null;
}

export function toFirstLanguage(value: string | null): FirstLanguage | null {
  return FIRST_LANGUAGE_OPTIONS.find((language) => language === value) ?? null;
}

// The Diagnostic column has no "not set" state — spec §4 names exactly three
// labels — so an absent or unrecognised status reads as the server's own
// default for a child with no sitting on file.
export function toDiagnosticStatus(value: string | null): DiagnosticStatus {
  return DIAGNOSTIC_STATUS_OPTIONS.find((status) => status === value) ?? DEFAULT_DIAGNOSTIC_STATUS;
}
