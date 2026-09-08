export { OpsSchoolsTable } from './components/OpsSchoolsTable';
export { OpsSchoolDetail } from './components/OpsSchoolDetail';
export { OpsClassDetail } from './components/OpsClassDetail';
export { OpsSchoolTables } from './components/OpsSchoolTables';
export { OpsSchoolInvitationPanel } from './components/OpsSchoolInvitationPanel';
export { OpsSchoolCountCards } from './components/OpsSchoolCountCards';
export { OpsOnboardSchoolDialog } from './components/OpsOnboardSchoolDialog';
export { OpsStudentImport } from './components/OpsStudentImport';
export { OpsSectionTimers } from './components/OpsSectionTimers';
/* ledger 6 — the Audit console (audit ledger + API tokens) */
export { OpsAuditConsole } from './components/OpsAuditConsole';
/* ledger 7 — the Comms console (templates, email log, both composers) */
export { OpsCommsConsole } from './components/OpsCommsConsole';
/* ledger 9 — the Flags console (registry toggle + the three settings editors) */
export { OpsFlagsConsole } from './components/OpsFlagsConsole';
export { OpsFormWindow } from './components/OpsFormWindow';
export { OpsSittingRecovery } from './components/OpsSittingRecovery';
export { OpsPlatformSettings } from './components/OpsPlatformSettings';
export { OpsSystemConsole } from './components/OpsSystemConsole';
export { OpsContentConsole } from './components/OpsContentConsole';
export { OpsPipelinePanel } from './components/OpsPipelinePanel';
export { OpsSystemMaintenance } from './components/OpsSystemMaintenance';
export { usePlatformSettingsQuery } from './queries/use-platform-settings.query';
export { useSchoolInvitationQuery } from './queries/use-school-invitation.query';
export { useOnboardSchoolMutation } from './queries/use-onboard-school.mutation';
export { useResendInvitationMutation } from './queries/use-resend-invitation.mutation';
export { useRevokeInvitationMutation } from './queries/use-revoke-invitation.mutation';
export type { OpsSchool, OpsSchoolsResponse } from './types/ops.types';
export type {
  AdminInvitationResult,
  OnboardingLinkResult,
  RevokeInvitationResult,
  SchoolInvitation,
} from './types/school-invitation.types';
export type { ImportCommitResult, ImportPreview } from './schemas/import.schema';
export type { PlatformSettings, PlatformSettingsForm } from './types/platform-settings.types';

/* --- ledger 11 / D-007: the C-OPS-04 inspection surfaces --- */
export { OpsFormInspection } from './components/OpsFormInspection';
export { OpsResponsesExport } from './components/OpsResponsesExport';
export { OpsViewAsTeacherPanel } from './components/OpsViewAsTeacherPanel';
export { useFormInspectionQuery } from './queries/use-form-inspection.query';
export { useResponsesCsvQuery } from './queries/use-responses-csv.query';
export { useViewAsTeacherQuery } from './queries/use-view-as-teacher.query';
export type { OpsResponsesCsvFile } from './types/inspection.types';
