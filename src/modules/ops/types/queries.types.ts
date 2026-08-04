import type { OnboardSchoolValues } from '@/modules/ops/schemas/school-invitation.schema';
import type { SectionTimersMeta, TimerSection } from '@/modules/ops/schemas/section-timers.schema';

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

export interface OpsResitInput {
  sittingDocumentId: string;
  studentDocumentId: string;
}

export interface PipelineRetryInput {
  queue: string;
  jobId: string;
}

export interface SectionTimersState {
  sections: TimerSection[];
  meta: SectionTimersMeta | null;
}
