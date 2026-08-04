import type { OnboardingLinkResult, RevokeInvitationResult } from '@/modules/ops/types/school-invitation.types';
import type { UseMutationResult } from '@tanstack/react-query';

export interface UseInvitationActionsInput {
  documentId: string;
  resend: UseMutationResult<OnboardingLinkResult, unknown, string>;
  revoke: UseMutationResult<RevokeInvitationResult, unknown, string>;
}

export interface UseOnboardSchoolFormInput {
  schoolDocumentId: string;
  onDone: () => void;
}
