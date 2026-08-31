import { useSchoolClassesQuery } from '@/modules/classes';
import { useSchoolStudentsQuery } from '@/modules/school-students';
import { useTeachersQuery } from '@/modules/teachers';
import type {
  SchoolCommandItem,
  SchoolCommandResults,
} from '@/modules/school-command/types/school-command.types';

const CLASS_ROUTE = '/dashboard/school/classes';
const TEACHER_ROUTE = '/dashboard/school/teachers';
const STUDENT_ROUTE = '/dashboard/school/students';

/** How many student rows the palette renders per group. The TOTAL comes from
 * the payload's meta.pagination.total — the page is capped, the count is not. */
const STUDENT_PAGE_SIZE = 5;

function matches(haystack: string | null | undefined, needle: string): boolean {
  if (needle === '') return true;
  return (haystack ?? '').toLowerCase().includes(needle);
}

/**
 * The ⌘K palette's data source. Reuse over rebuild: the three existing
 * school-admin queries power it — C-CLS-01 classes and C-TCH-01 teachers are
 * whole-school lists (hook-side substring filter), while students search runs
 * SERVER-SIDE through C-CHD-01's q param, so the students group heading count
 * is the payload's meta.pagination.total, not a count of what happened to fit
 * on the page. Counts quoted per group in the dialog come from exactly these
 * arrays / that payload field.
 */
export function useSchoolCommandResults(rawQuery: string): SchoolCommandResults {
  const query = rawQuery.trim().toLowerCase();
  const studentsEnabled = query !== '';

  const classesQuery = useSchoolClassesQuery(true);
  const teachersQuery = useTeachersQuery(true);
  const studentsQuery = useSchoolStudentsQuery(
    { status: 'all', classId: 'all', q: rawQuery.trim(), page: 1, pageSize: STUDENT_PAGE_SIZE },
    studentsEnabled,
  );

  const filteredClasses = (classesQuery.data ?? []).filter((row) => matches(row.name, query));
  const classes: SchoolCommandItem[] = filteredClasses.slice(0, STUDENT_PAGE_SIZE).map((row) => ({
    id: row.documentId,
    group: 'classes' as const,
    label: row.name,
    meta: null,
    href: `${CLASS_ROUTE}/${row.documentId}`,
  }));

  const filteredTeachers = (teachersQuery.data ?? []).filter(
    (row) =>
      matches(row.email, query) ||
      matches(row.first_name, query) ||
      matches(row.last_name, query),
  );
  const teachers: SchoolCommandItem[] = filteredTeachers
    .slice(0, STUDENT_PAGE_SIZE)
    .map((row) => ({
      id: row.documentId,
      group: 'teachers' as const,
      label:
        [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email,
      meta: row.email,
      href: `${TEACHER_ROUTE}/${row.documentId}`,
    }));

  const students: SchoolCommandItem[] = (studentsQuery.data?.rows ?? []).map((row) => ({
    id: row.documentId,
    group: 'students' as const,
    label: [row.given_name, row.family_name].filter(Boolean).join(' '),
    meta: row.class?.name ?? null,
    href: `${STUDENT_ROUTE}/${row.documentId}`,
  }));

  return {
    classes,
    classesTotal: filteredClasses.length,
    teachers,
    teachersTotal: filteredTeachers.length,
    students,
    studentsTotal: studentsQuery.data?.pagination.total ?? null,
  };
}
