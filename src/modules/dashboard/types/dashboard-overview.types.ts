import type { StudentListRow } from './student.types';

export interface DashboardOverview {
  totalStudents: number;
  activeStudents: number;
  enrolledStudents: number;
  studentsWithEntryPlan: number;
  entryPlanCompletion: number;
  recentStudents: StudentListRow[];
}
