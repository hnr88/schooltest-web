import type { StudentListRow } from './student.types';

export interface DashboardOverview {
  totalStudents: number;
  activeStudents: number;
  enrolledStudents: number;
  studentsWithEntryPlan: number;
  studentsMissingEntryPlan: number;
  entryPlanCompletion: number;
  recentStudents: StudentListRow[];
}
