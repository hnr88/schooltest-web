import type { FirstLanguage, AcaraPhase } from '@/modules/school-students/types/constants.types';

// C-CHD-02 v2 boundary picklists (task 59 server side, task 30 form side).
// Stored as these exact string keys; the server validates against the same
// lists and answers 400 to anything else, so the selects below are the only
// way a value reaches the API. Human labels live in the locale files under
// SchoolStudents.form.firstLanguageOption / acaraPhaseOption.
export const FIRST_LANGUAGE_OPTIONS = [
  'mandarin_chinese',
  'korean',
  'japanese',
  'malay',
  'thai',
  'vietnamese',
  'indonesian',
  'english',
  'other',
] as const;

// Optional ACARA EAL/D proficiency phase. Held back from every teacher-facing
// surface (D-10): the school's existing label must not colour results reading.
export const ACARA_PHASE_OPTIONS = [
  'beginning',
  'emerging',
  'developing',
  'consolidating',
] as const;

// Read-only C-CHD-01 column: the diagnostic status the server computes per row.
// Never written from this client. Labels live under
// SchoolStudents.table.diagnosticOption.
export const DIAGNOSTIC_STATUS_OPTIONS = ['not_started', 'in_progress', 'completed'] as const;

export const DEFAULT_DIAGNOSTIC_STATUS = 'not_started';
