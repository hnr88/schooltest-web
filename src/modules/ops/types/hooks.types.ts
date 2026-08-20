import type {
  OnboardingLinkResult,
  RevokeInvitationResult,
} from '@/modules/ops/types/school-invitation.types';
import type { OpsSchoolAdminInviteMode } from '@/modules/ops/lib/ops-school-admin-invite';
import type { UseMutationResult } from '@tanstack/react-query';

export interface UseInvitationActionsInput {
  documentId: string;
  resend: UseMutationResult<OnboardingLinkResult, unknown, string>;
  revoke: UseMutationResult<RevokeInvitationResult, unknown, string>;
}

export interface UseOnboardSchoolFormInput {
  schoolDocumentId: string;
  mode: Exclude<OpsSchoolAdminInviteMode, 'onboarding_pending'>;
  onDone: (email: string) => void;
}
