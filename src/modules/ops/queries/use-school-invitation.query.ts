'use client';

/**
 * C-SCH-07 kept its original module path so the three onboarding mutations and
 * the ops barrel keep importing it unchanged. The implementation moved to
 * `use-onboarding-read.query.ts` under its portal contract id
 * (C-OPS-PORTAL-011, OPS-021): ONE fetcher, ONE query key and ONE parse of the
 * shared response schema, instead of a second copy that could drift from it.
 */
export {
  onboardingReadQueryKey as schoolInvitationQueryKey,
  useOnboardingReadQuery as useSchoolInvitationQuery,
} from '@/modules/ops/queries/use-onboarding-read.query';
