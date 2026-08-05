import type { SchoolParticipation } from '@/modules/school-admin';
import type { SchoolTeacherClass } from '@/modules/teachers/types/teachers.types';

// Spec section 3 warns about removal "if the teacher has associated sittings or
// results". The C-TCH-01 roster row cannot answer that — it carries class names
// and nothing else — but C-RPT-04 participation reports, per class, how many
// students have SUBMITTED (a result) or are mid-sitting. A class therefore has
// sittings or results when either test slot has any of either.
export function reportingClassIds(
  participation: SchoolParticipation | undefined,
): Set<string> | null {
  if (!participation) return null;
  return new Set(
    participation.classes
      .filter(
        (row) =>
          row.test_a.submitted +
            row.test_a.in_progress +
            row.test_b.submitted +
            row.test_b.in_progress >
          0,
      )
      .map((row) => row.documentId),
  );
}

// `null` in, `null` out: participation that could not be read leaves the fact
// UNKNOWN, and an unknown fact never becomes a warning.
export function countReportingClasses(
  classes: SchoolTeacherClass[],
  ids: Set<string> | null,
): number | null {
  if (!ids) return null;
  return classes.filter((klass) => ids.has(klass.documentId)).length;
}
