import type { AvatarStackEntry } from '@/modules/design-system';

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
  recentActivity: DashboardActivityEntry[];
  familyAvatars: AvatarStackEntry[];
}

/** One ledger row. `kind` is derived from the two real timestamps the students
 *  read returns — nothing else in the parent contract is an event. */
export interface DashboardActivityEntry {
  documentId: string;
  student: StudentListRow;
  kind: 'added' | 'updated';
  at: string;
}

/** One tick of the per-child readiness rail — a planning field and whether the
 *  API returned a value for it. Never a score, never a CEFR band (Amendment A1). */
export type ReadinessFieldKey =
  | 'familyName'
  | 'email'
  | 'nationality'
  | 'yearLevel'
  | 'entryYear'
  | 'entryTerm';

export interface ReadinessField {
  key: ReadinessFieldKey;
  filled: boolean;
}

/** One "Recommended next" row. Every kind is derived from a real gap in the
 *  students read — there is no recommendations endpoint to invent one from. */
export type DashboardRecommendationKind =
  | 'addChild'
  | 'setPlan'
  | 'completeProfile'
  | 'exploreSchools';

export interface DashboardRecommendation {
  id: string;
  kind: DashboardRecommendationKind;
  student: StudentListRow | null;
  href: string;
}

/** Localised labels + number formatting for the greeting's bare stat strip. */
export interface PlanBoardLabels {
  format: (value: number) => string;
  fraction: (completed: string, total: string) => string;
  totalProfiles: string;
  entryPlans: string;
  needingPlan: string;
  enrolled: string;
}
