import { RECENT_STUDENTS_LIMIT } from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

export function hasEntryPlan(student: StudentListRow): boolean {
  return Boolean(student.target_entry_year && student.target_entry_term);
}

export function getStudentInitials(student: StudentListRow): string {
  const initials = `${student.given_name.trim().charAt(0)}${student.family_name.trim().charAt(0)}`;

  return initials.toUpperCase() || '?';
}

export function getDashboardOverview(students: StudentListRow[]): DashboardOverview {
  const totalStudents = students.length;
  const studentsWithEntryPlan = students.filter(hasEntryPlan).length;

  return {
    totalStudents,
    activeStudents: students.filter((student) => student.status === 'active').length,
    enrolledStudents: students.filter((student) => student.status === 'enrolled').length,
    studentsWithEntryPlan,
    entryPlanCompletion:
      totalStudents === 0 ? 0 : Math.round((studentsWithEntryPlan / totalStudents) * 100),
    recentStudents: [...students]
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .slice(0, RECENT_STUDENTS_LIMIT),
  };
}
