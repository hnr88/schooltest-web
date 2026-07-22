import { getTargetEntry } from '@/modules/children/lib/student-display';
import { formatYearLevel } from '@/modules/children/lib/year-level';
import type { ChildCardMetric } from '@/modules/children/types/children.types';
import type { StudentListRow } from '@/modules/dashboard';

interface CardLabels {
  formatYear: (year: number) => string;
  yearLevel: string;
  targetEntry: string;
}

// The design's MetricStrip (§A.5 row 2) is three cells: "% to {next level}"
// (B-4), "day streak" (no streak field is modelled anywhere) and "last result %"
// (B-3). None is buildable, so the strip carries fields the C-STUDENT-LIST-EXT row
// really has — and TWO of them, not three: the real values are label-shaped
// ("2027 · Term 1"), not the design's two-glyph numbers, and a third 110px cell
// broke every one of them onto two lines. The added date moves to the footer line
// the design keeps for a note. A cell the API never recorded keeps a null value so
// the card prints the honest em dash instead of a number.
export function getChildCardMetrics(
  student: StudentListRow,
  { formatYear, yearLevel, targetEntry }: CardLabels,
): ChildCardMetric[] {
  return [
    { label: yearLevel, value: formatYearLevel(student, formatYear) },
    { label: targetEntry, value: getTargetEntry(student) },
  ];
}

// The 13px identity sub-line under the name (§A.5). The design prints
// "Year 7 · Riverside College, Parramatta"; the list read carries no school, so
// this joins the identity facts it DOES carry and collapses to nothing when the
// row has none.
export function getChildCardMeta(student: StudentListRow): string | null {
  const facts = [student.nationality, student.email].filter((fact): fact is string =>
    Boolean(fact && fact.trim()),
  );
  return facts.length > 0 ? facts.join(' · ') : null;
}
