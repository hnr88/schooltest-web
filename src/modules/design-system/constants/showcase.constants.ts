export const TABS = [
  { value: 'overview', labelKey: 'tabsOverview', panelKey: 'tabsOverviewPanel' },
  { value: 'questions', labelKey: 'tabsQuestions', panelKey: 'tabsQuestionsPanel' },
  { value: 'results', labelKey: 'tabsResults', panelKey: 'tabsResultsPanel' },
] as const;

export const COVER_SIZES = '(min-width: 1024px) 22rem, 100vw';

export const PANEL =
  'flex flex-col gap-3 rounded-panel border border-border bg-card p-5.5 shadow-sm';

export const MONTH_KEYS = [
  'recordMonthMar',
  'recordMonthApr',
  'recordMonthMay',
  'recordMonthJun',
  'recordMonthJul',
] as const;

export const FACT_KEYS = [
  ['recordYearLevel', 'recordYearLevelValue'],
  ['recordNationality', 'recordNationalityValue'],
  ['recordTargetEntry', 'recordTargetEntryValue'],
  ['recordGlassCorrect', 'recordGlassCorrectValue'],
  ['recordGlassBand', 'recordGlassBandValue'],
] as const;
