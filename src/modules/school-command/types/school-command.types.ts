export type SchoolCommandGroup = 'classes' | 'teachers' | 'students';

/** One addressable result row in the ⌘K palette. */
export interface SchoolCommandItem {
  id: string;
  group: SchoolCommandGroup;
  label: string;
  /** Secondary line (teacher count, email, class name) — real payload fields. */
  meta: string | null;
  href: string;
}

/**
 * Grouped results for the current query. Classes/teachers items are the
 * first N filtered rows; `classesTotal`/`teachersTotal` are the FULL filtered
 * counts (so a heading can say "7 classes" while the list shows five).
 * `studentsTotal` is the SERVER's meta.pagination.total for the q search
 * (C-CHD-01 applies q before paginating) — every heading count is therefore
 * a payload-derived total, never a count of what happened to fit on screen.
 */
export interface SchoolCommandResults {
  classes: SchoolCommandItem[];
  classesTotal: number;
  teachers: SchoolCommandItem[];
  teachersTotal: number;
  students: SchoolCommandItem[];
  studentsTotal: number | null;
}
