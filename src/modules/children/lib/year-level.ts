import type { YearLevelSource } from '@/modules/children/types/children.types';

// "Year 7" / "year 7" / "7" → 7. Anything else (e.g. "Prep") is real free text
// that must survive verbatim, so it returns null and the caller renders it as-is.
const NUMERIC_YEAR = /^(?:year\s*)?(\d{1,2})$/i;

export function parseYearLevel(value: string): number | null {
  const match = NUMERIC_YEAR.exec(value.trim());
  return match ? Number(match[1]) : null;
}

// The ONE place a year level becomes a label. The roster mixed a formatted
// `current_year_level` ("Year 7") with a bare `year_level` integer ("8") in the
// same column; both now go through the same "Year {n}" pattern, and a value the
// API never recorded stays null so the caller can show the canonical "—".
export function formatYearLevel(
  student: YearLevelSource,
  formatYear: (year: number) => string,
): string | null {
  const recorded = student.current_year_level?.trim();
  if (recorded) {
    const parsed = parseYearLevel(recorded);
    return parsed === null ? recorded : formatYear(parsed);
  }
  if (typeof student.year_level === 'number') {
    return formatYear(student.year_level);
  }
  return null;
}
