import type { SchoolAccountStatus, SchoolOnboardingStatus, SchoolPlan } from '@/modules/school-admin';

// C-OPS-01 (GET /api/ops/schools) row — the ops console cross-school read.
// Every count is computed server-side at read, never stored.
export interface OpsSchool {
  documentId: string;
  name: string;
  account_status: SchoolAccountStatus;
  onboarding_status: SchoolOnboardingStatus;
  // The stored product tier (spec §Plan System). Null only for a school row
  // written before the column existed — the API never invents a tier.
  plan: SchoolPlan | null;
  teacher_count: number;
  class_count: number;
  student_count: number;
  results_count: number;
}

// OPS-teacher-details (task 064): one staff row from the ops directory — the
// exact C-TCH-01 shape (email-first sort, whitelist projection, classes
// grouped from api::class.class.teacher).
export interface OpsTeacherRow {
  documentId: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  blocked: boolean;
  classes: { documentId: string; name: string | null }[];
}

// Strapi v5 collection envelope; the ops controller returns an empty meta.
export interface OpsSchoolsResponse {
  data: OpsSchool[];
  meta: Record<string, unknown>;
}
