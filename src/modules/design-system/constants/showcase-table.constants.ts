// Demo rows for the /design-system Table exhibit. Gallery-only sample data —
// never rendered by a product surface.
export const SHOWCASE_TABLE_ROWS = [
  {
    nameKey: 'tableRowMath',
    date: '02.07',
    questions: 12,
    avg: '8.5',
    status: 'live',
    labelKey: 'badgeLive',
  },
  {
    nameKey: 'tableRowScience',
    date: '05.07',
    questions: 20,
    avg: '7.9',
    status: 'scheduled',
    labelKey: 'badgeScheduled',
  },
  {
    nameKey: 'tableRowHistory',
    date: '09.07',
    questions: 26,
    avg: '8.8',
    status: 'live',
    labelKey: 'badgeLive',
  },
  {
    nameKey: 'tableRowReading',
    date: '12.07',
    questions: 18,
    avg: '9.1',
    status: 'draft',
    labelKey: 'badgeDraft',
  },
] as const;
