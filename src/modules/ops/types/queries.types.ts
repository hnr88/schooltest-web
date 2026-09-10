import type { OnboardSchoolValues } from '@/modules/ops/schemas/school-invitation.schema';
import type { SchoolPlan } from '@/modules/school-admin';

export interface ImportStudentsInput {
  schoolDocumentId: string;
  csv: string;
}

export interface OnboardSchoolInput extends OnboardSchoolValues {
  schoolDocumentId: string;
}

export interface InviteSchoolAdminInput extends OnboardSchoolValues {
  schoolDocumentId: string;
}

export interface SchoolPlanInput {
  schoolDocumentId: string;
  plan: SchoolPlan;
}

