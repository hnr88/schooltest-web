import {
  FEATURED_STUDENTS_LIMIT,
  RECENT_STUDENTS_LIMIT,
  RECENTLY_ADDED_DAYS,
} from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

const DAY_IN_MS = 86_400_000;

export function hasEntryPlan(student: StudentListRow): boolean {
  return Boolean(student.target_entry_year && student.target_entry_term);
}

export function getDashboardEntryPlan(student: StudentListRow): string | null {
  if (!student.target_entry_year) return null;

  return student.target_entry_term
    ? `${student.target_entry_year} · ${student.target_entry_term}`
    : student.target_entry_year;
}

export function getDashboardYearLevel(student: StudentListRow): string | null {
  return student.current_year_level ?? student.year_level?.toString() ?? null;
}

// Profile readiness is the share of the six planning fields a parent can fill in
// that carry a value — the only progress signal this account actually holds, so
// no number on the overview is invented.
export function getProfileCompletion(student: StudentListRow): number {
  const fields = [
    student.family_name,
    student.email,
    student.nationality,
    getDashboardYearLevel(student),
    student.target_entry_year,
    student.target_entry_term,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function isRecentlyAdded(student: StudentListRow, now: number): boolean {
  const createdAt = new Date(student.createdAt).getTime();

  return Number.isFinite(createdAt) && now - createdAt <= RECENTLY_ADDED_DAYS * DAY_IN_MS;
}

export function getDashboardOverview(students: StudentListRow[]): DashboardOverview {
  const totalStudents = students.length;
  const studentsWithEntryPlan = students.filter(hasEntryPlan).length;
  const now = Date.now();
  const byNewest = [...students].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );

  return {
    totalStudents,
    activeStudents: students.filter((student) => student.status === 'active').length,
    enrolledStudents: students.filter((student) => student.status === 'enrolled').length,
    studentsWithEntryPlan,
    studentsMissingEntryPlan: totalStudents - studentsWithEntryPlan,
    entryPlanCompletion:
      totalStudents === 0 ? 0 : Math.round((studentsWithEntryPlan / totalStudents) * 100),
    addedRecently: students.filter((student) => isRecentlyAdded(student, now)).length,
    profileCompletionAverage:
      totalStudents === 0
        ? 0
        : Math.round(
            students.reduce((total, student) => total + getProfileCompletion(student), 0) /
              totalStudents,
          ),
    featuredStudents: byNewest.slice(0, FEATURED_STUDENTS_LIMIT),
    recentStudents: byNewest.slice(0, RECENT_STUDENTS_LIMIT),
  };
}
