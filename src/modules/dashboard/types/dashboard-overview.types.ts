import type { StudentListRow } from './student.types';

export interface DashboardOverview {
  totalStudents: number;
  activeStudents: number;
  enrolledStudents: number;
  studentsWithEntryPlan: number;
  studentsMissingEntryPlan: number;
  entryPlanCompletion: number;
  addedRecently: number;
  profileCompletionAverage: number;
  featuredStudents: StudentListRow[];
  recentStudents: StudentListRow[];
}
