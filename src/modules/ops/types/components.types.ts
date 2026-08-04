import type { FormInspection } from '@/modules/ops/types/schemas.types';

import type { FormWindow, OpsForm } from '@/modules/ops/schemas/form-window.schema';
import type { ImportPreview } from '@/modules/ops/schemas/import.schema';
import type { PipelineQueue } from '@/modules/ops/schemas/pipeline.schema';
import type { RecoveryMonitorStudent } from '@/modules/ops/types/schemas.types';
import type { SectionTimersMeta, TimerSection } from '@/modules/ops/schemas/section-timers.schema';
import type { ViewAsTeacher } from '@/modules/ops/schemas/surfaces.schema';
import type { OpsSchool } from '@/modules/ops/types/ops.types';
import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';
import type { UseFormReturn } from 'react-hook-form';

export interface OpsFormWindowEditorProps {
  schoolDocumentId: string;
  currentWindow: FormWindow | null;
  forms: OpsForm[];
}

export interface OpsFormWindowProps {
  documentId: string;
}

export interface OpsImportCreateTableProps {
  rows: ImportPreview['create'];
}

export interface OpsImportPreviewTablesProps {
  preview: ImportPreview;
}

export interface OpsOnboardSchoolDialogProps {
  schoolDocumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface OpsPipelineQueueRowProps {
  queue: PipelineQueue;
}

export interface OpsSchoolCountCardsProps {
  school: OpsSchool;
}

export interface OpsSchoolDetailProps {
  documentId: string;
}

export interface OpsSchoolInvitationPanelProps {
  documentId: string;
  enabled: boolean;
}

export interface OpsSchoolRowProps {
  school: OpsSchool;
}

export interface OpsSectionTimersFormProps {
  sections: TimerSection[];
  meta: SectionTimersMeta | null;
}

export interface OpsSettingsControlProps {
  readonly form: UseFormReturn<PlatformSettingsForm>;
  readonly field: keyof PlatformSettingsForm;
  readonly label: string;
  readonly helperText?: string;
  readonly optionLabel: (option: string) => string;
}

export interface OpsSittingRecoveryDetailProps {
  sittingDocumentId: string;
}

export interface OpsSittingRecoveryTableProps {
  students: RecoveryMonitorStudent[];
  resitting: boolean;
  onResit: (studentDocumentId: string, studentName: string) => void;
}

export interface OpsSittingRecoveryProps {
  schoolDocumentId: string;
}

export interface OpsStudentImportProps {
  documentId: string;
}

export interface OpsViewAsTeacherDataProps {
  view: ViewAsTeacher;
}

export interface OpsFormInspectionResultProps {
  inspection: FormInspection;
}
