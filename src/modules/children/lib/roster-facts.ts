import { getTargetEntry } from '@/modules/children/lib/student-display';
import { formatYearLevel } from '@/modules/children/lib/year-level';
import type { RosterFacts } from '@/modules/children/types/children.types';
import type { StudentListRow } from '@/modules/dashboard';

// The roster's meta cells. Nulls stay null so the row can render the canonical
// "—" in slate-400 instead of a translated "Not available" sentence in a cell.
// The year level goes through the shared formatter so every row reads "Year 8",
// never a bare integer next to a neighbour's "Year 7".
export function getRosterFacts(
  student: StudentListRow,
  formatYear: (year: number) => string,
): RosterFacts {
  return {
    yearLevel: formatYearLevel(student, formatYear),
    targetEntry: getTargetEntry(student),
    nationality: student.nationality,
  };
}
