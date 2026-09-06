import type { SchoolDetail, StaffUserRole, SchoolsListRow } from '@schooltest/ops-contracts';

import type { FormWindow, OpsForm } from '@/modules/ops/schemas/form-window.schema';
import type { PortalImportPreview } from '@/modules/ops/schemas/import.schema';
import type { RecoveryMonitorStudent } from '@/modules/ops/types/schemas.types';
import type { SectionTimersMeta, TimerSection } from '@/modules/ops/schemas/section-timers.schema';
import type { OpsSchool, OpsTeacherRow } from '@/modules/ops/types/ops.types';
import type { OpsSchoolAdminInviteMode } from '@/modules/ops/lib/ops-school-admin-invite';
import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';
import type { SchoolPlan } from '@/modules/school-admin';
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
  rows: PortalImportPreview['create'];
}

/** One rendered school row. Kept: the component is still used elsewhere. */
export interface OpsSchoolRowProps {
  school: SchoolsListRow;
}

export interface OpsImportPreviewTablesProps {
  preview: PortalImportPreview;
}

export interface OpsOnboardSchoolDialogProps {
  schoolDocumentId: string;
  mode: Exclude<OpsSchoolAdminInviteMode, 'onboarding_pending'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: (email: string) => void;
}

export interface OpsSchoolDetailProps {
  documentId: string;
}

export interface OpsSchoolInvitationPanelProps {
  documentId: string;
  enabled: boolean;
}

export interface OpsSchoolPlanPanelProps {
  documentId: string;
  plan: SchoolPlan | null;
}

export interface EditState {
  documentId: string;
  values: { first_name: string; last_name: string; email: string };
}

export interface OpsTeachersDialogProps {
  schoolDocumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface OpsTeachersTableRowProps {
  row: OpsTeacherRow;
  editing: EditState | null;
  onEditingChange: (next: EditState | null) => void;
  removing: boolean;
  onRemovingChange: (documentId: string | null) => void;
  onSave: () => void;
  onRemove: () => void;
  savePending: boolean;
  removePending: boolean;
  error: string | null;
}

export interface OpsSchoolCountCardsProps {
  school: SchoolDetail;
  /** OPS-teacher-details: clicking the Teachers card opens the directory. */
  onTeachersClick?: () => void;
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

export interface OpsClassDetailProps {
  classDocumentId: string;
  schoolDocumentId: string;
}

export interface OpsEditClassDialogProps {
  classDocumentId: string;
  schoolDocumentId: string;
  className: string;
  /** The class `updatedAt` the form opened with — the edit's If-Match token. */
  classUpdatedAt: string | null;
  currentYearBand: string | null;
  onClose: () => void;
}

export interface OpsSchoolTablesProps {
  schoolDocumentId: string;
  /** The detail row, for the Overview panel's profile fields. */
  school: SchoolDetail;
}

/** C-OPS-PORTAL-015 — the shared Admins/Teachers directory table (OPS-025). */
export interface OpsStaffUsersTableProps {
  schoolDocumentId: string;
  role: StaffUserRole;
  enabled: boolean;
  emptyTitle: string;
  emptyDescription: string;
  /** Class counts keyed by teacher documentId; omitted hides the column. */
  classCounts?: Record<string, number>;
}
