/**
 * The ONE place a student's name is composed for display (M-CT-STUDENT-NAME).
 *
 * CT-1 declares `given_name` REQUIRED and `family_name` OPTIONAL server-side:
 * spec E2.1 makes paste-a-list — one NAME per line — the primary roster path, so
 * a single-token name is the designed shape, and mononyms are ordinary besides.
 * Every surface that shows a student (dashboard roster, children table/cards,
 * child profile hero, settings children tab, search results, row actions and
 * their toasts/aria-labels) goes through these two functions, so a missing
 * family name can never render as "Mia null", "Mia " or an empty cell.
 *
 * Structural, not nominal: any row carrying the two name keys is accepted, which
 * covers the C-STUDENT-LIST base row, the C-STUDENT-LIST-EXT list/detail rows and
 * the C-PARENT-CHILD-PROGRESS student (whose `given_name` is nullable because
 * pre-constraint rows can still hold null).
 */
export interface StudentNameParts {
  given_name: string | null;
  family_name: string | null;
}

/** Non-empty, trimmed name parts in display order (given, then family). */
function nameParts(student: StudentNameParts): string[] {
  return [student.given_name, student.family_name]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0);
}

/**
 * Full display name — "Mia Keller", or just "Mia" for a mononym. `fallback` is
 * the caller's localized `t()` string (e.g. `Children.unknownStudent`), used only
 * when the row carries no name at all (rows predating the required constraint).
 */
export function getStudentDisplayName(student: StudentNameParts, fallback: string): string {
  const name = nameParts(student).join(' ');
  return name || fallback;
}

/** Avatar initials — "MK", "M" for a mononym, "?" when there is no name at all. */
export function getStudentInitials(student: StudentNameParts): string {
  const initials = nameParts(student)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
  return initials || '?';
}
