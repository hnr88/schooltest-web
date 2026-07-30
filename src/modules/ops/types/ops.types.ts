import type { SchoolAccountStatus, SchoolOnboardingStatus } from '@/modules/school-admin';

// C-OPS-01 (GET /api/ops/schools) row — the ops console cross-school read.
// Every count is computed server-side at read, never stored.
export interface OpsSchool {
  documentId: string;
  name: string;
  account_status: SchoolAccountStatus;
  onboarding_status: SchoolOnboardingStatus;
  teacher_count: number;
  class_count: number;
  student_count: number;
  results_count: number;
}

// Strapi v5 collection envelope; the ops controller returns an empty meta.
export interface OpsSchoolsResponse {
  data: OpsSchool[];
  meta: Record<string, unknown>;
}
