import type { StaffUserRole, SchoolsListRow } from '@schooltest/ops-contracts';

import type { FormWindow, OpsForm } from '@/modules/ops/schemas/form-window.schema';
import type { PortalImportPreview } from '@/modules/ops/schemas/import.schema';
import type { RecoveryMonitorStudent } from '@/modules/ops/types/schemas.types';
import type { SectionTimersMeta, TimerSection } from '@/modules/ops/schemas/section-timers.schema';
import type { OpsSchool, OpsTeacherRow } from '@/modules/ops/types/ops.types';
import type { SchoolsFilterState } from '@/modules/ops/lib/schools-filter.lib';
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

export interface OpsSchoolRowProps {
  /** The C-OPS-PORTAL-001 versioned row (contract types, not the legacy shape). */
  school: SchoolsListRow;
}

export interface OpsSchoolsFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  accountStatus: SchoolsFilterState['accountStatus'];
  onAccountStatusChange: (value: string) => void;
  onboardingStatus: SchoolsFilterState['onboardingStatus'];
  onOnboardingStatusChange: (value: string) => void;
  state: SchoolsFilterState['state'];
  onStateChange: (value: string) => void;
  sector: SchoolsFilterState['sector'];
  onSectorChange: (value: string) => void;
  sort: SchoolsFilterState['sort'];
  onSortChange: (value: string) => void;
  onClearAll: () => void;
  showingCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
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
  school: OpsSchool;
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
  currentYearBand: string | null;
  currentTeacherDocumentId: string | null;
  onClose: () => void;
}

export interface OpsSchoolTablesProps {
  schoolDocumentId: string;
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
