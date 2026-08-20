export type OpsSchoolAdminInviteMode = 'onboarding' | 'onboarding_pending' | 'staff_invitation';

export function getOpsSchoolAdminInviteMode(
  onboardingStatus: string | null,
): OpsSchoolAdminInviteMode {
  if (onboardingStatus === 'link_sent') return 'onboarding_pending';
  if (onboardingStatus === 'not_started' || onboardingStatus === null) return 'onboarding';
  return 'staff_invitation';
}
