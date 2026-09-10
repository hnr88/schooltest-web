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

export type ShowcaseTableRow = (typeof SHOWCASE_TABLE_ROWS)[number];

/**
 * Row 46 — the Table exhibit's two sortable columns (Date, Avg), rendered
 * through `@/modules/directory` in `client` mode. `date` is stored `DD.MM`
 * and parsed to a comparable number rather than compared lexicographically
 * (a string compare breaks the moment the month digit changes); `avg` is a
 * decimal string parsed to a number.
 */
function parseShowcaseDate(value: string): number {
  const [day, month] = value.split('.').map(Number);
  return month * 100 + day;
}

export const SHOWCASE_TABLE_COMPARATORS: Readonly<
  Record<string, (a: ShowcaseTableRow, b: ShowcaseTableRow) => number>
> = {
  'date:asc': (a, b) => parseShowcaseDate(a.date) - parseShowcaseDate(b.date),
  'date:desc': (a, b) => parseShowcaseDate(b.date) - parseShowcaseDate(a.date),
  'avg:asc': (a, b) => Number(a.avg) - Number(b.avg),
  'avg:desc': (a, b) => Number(b.avg) - Number(a.avg),
};
