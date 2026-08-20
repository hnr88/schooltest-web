import type { OnboardSchoolValues } from '@/modules/ops/schemas/school-invitation.schema';
import type { SectionTimersMeta, TimerSection } from '@/modules/ops/schemas/section-timers.schema';
import type { SchoolPlan } from '@/modules/school-admin';

export interface PutFormWindowInput {
  schoolDocumentId: string;
  form_documentId: string;
  opens_at: string;
  closes_at: string;
}

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

export interface OpsResitInput {
  sittingDocumentId: string;
  studentDocumentId: string;
}

export interface SectionTimersState {
  sections: TimerSection[];
  meta: SectionTimersMeta | null;
}
