// C-CHD-02 v2 boundary picklists (task 59 server side, task 30 form side).
// Stored as these exact string keys; the server validates against the same
// lists and answers 400 to anything else, so the selects below are the only
// way a value reaches the API. Human labels live in the locale files under
// SchoolChildren.form.firstLanguageOption / acaraPhaseOption.
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

export type FirstLanguage = (typeof FIRST_LANGUAGE_OPTIONS)[number];

// Optional ACARA EAL/D proficiency phase. Held back from every teacher-facing
// surface (D-10): the school's existing label must not colour results reading.
export const ACARA_PHASE_OPTIONS = [
  'beginning',
  'emerging',
  'developing',
  'consolidating',
] as const;

export type AcaraPhase = (typeof ACARA_PHASE_OPTIONS)[number];
