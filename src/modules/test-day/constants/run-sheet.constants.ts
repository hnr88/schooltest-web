// Run-sheet section shape (task 65). Section key lists only — every sentence
// lives in the RunSheet i18n namespace so all six locales stay in lockstep.
// `say` is the verbatim block the teacher reads aloud, so it renders as a
// quotable card rather than a numbered list.

export interface RunSheetListSection {
  key: 'before' | 'start' | 'during' | 'trouble' | 'after';
  items: readonly string[];
}

export const RUN_SHEET_SECTIONS_BEFORE_SAY: readonly RunSheetListSection[] = [
  { key: 'before', items: ['itemOne', 'itemTwo'] },
  { key: 'start', items: ['itemOne', 'itemTwo'] },
];

export const RUN_SHEET_SECTIONS_AFTER_SAY: readonly RunSheetListSection[] = [
  { key: 'during', items: ['itemOne', 'itemTwo', 'itemThree'] },
  { key: 'trouble', items: ['itemOne', 'itemTwo'] },
  { key: 'after', items: ['itemOne', 'itemTwo'] },
];

export const RUN_SHEET_SAY_LINES = [
  'lineOne',
  'lineTwo',
  'lineThree',
  'lineFour',
  'lineFive',
] as const;
