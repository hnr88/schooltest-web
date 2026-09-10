export { OpsSchoolsTable } from './components/OpsSchoolsTable';
export { OpsSchoolDetail } from './components/OpsSchoolDetail';
export { OpsClassDetail } from './components/OpsClassDetail';
export { OpsSchoolTables } from './components/OpsSchoolTables';
export { OpsSchoolInvitationPanel } from './components/OpsSchoolInvitationPanel';
export { OpsSchoolCountCards } from './components/OpsSchoolCountCards';
export { OpsOnboardSchoolDialog } from './components/OpsOnboardSchoolDialog';
export { OpsStudentImport } from './components/OpsStudentImport';
export { OpsFormWindow } from './components/OpsFormWindow';
export { OpsSittingRecovery } from './components/OpsSittingRecovery';
export { OpsPlatformSettings } from './components/OpsPlatformSettings';
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
// The portal's ONE confirm (U-24 / R-19). Exported here so the school-admin
// modules stop shipping near-identical clones of it; a seventh is forbidden.
export { OpsConfirmDialog } from './components/OpsConfirmDialog';
export type {
  OpsConfirmDialogProps,
  OpsConfirmNotice,
  OpsConfirmVariant,
} from './components/OpsConfirmDialog';
export { useFormInspectionQuery } from './queries/use-form-inspection.query';
export { useResponsesCsvQuery } from './queries/use-responses-csv.query';
export { useViewAsTeacherQuery } from './queries/use-view-as-teacher.query';
export type { OpsResponsesCsvFile } from './types/inspection.types';

/* ops/34 (D-71 pattern): the ONE append-only export line, so the teacher
   monitor's online gate consumes the portal's ONE listener through this
   barrel — never a second copy of the hook. */
export { useOnlineStatus } from './hooks/use-online-status';
