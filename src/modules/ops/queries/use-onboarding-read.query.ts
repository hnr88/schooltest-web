'use client';

import { useQuery } from '@tanstack/react-query';
import { schoolInvitationStateSchema, type SchoolInvitationState } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import {
  getOpsSchoolAdminInviteMode,
  type OpsSchoolAdminInviteMode,
} from '@/modules/ops/lib/ops-school-admin-invite';

/**
 * C-OPS-PORTAL-011 — GET /api/schools/{documentId}/onboarding-invitation.
 *
 * The key is UNCHANGED from the one the three onboarding mutations already
 * invalidate (`use-onboard-school.mutation`, `use-resend-invitation.mutation`,
 * `use-revoke-invitation.mutation`), so send, resend and revoke each drop this
 * cache entry exactly as before. Changing it would have silently left the panel
 * showing a revoked invitation until the next reload.
 */
export const onboardingReadQueryKey = (documentId: string) =>
  ['ops', 'school-invitation', documentId] as const;

/**
 * What ops may DO with this school's onboarding invitation right now.
 *
 * Derived from `onboarding_status` alone, because that is exactly what the
 * server gates on (`services/onboarding-invitation.ts`: not_started -> invite,
 * link_sent -> resend/revoke). `account_status` is deliberately NOT folded in:
 * the two columns are independent, an `active` account does not mean onboarding
 * finished, and `onboarding_status: "complete"` says the school finished the
 * onboarding wizard — never that a staff invitation was accepted. It is carried
 * through untouched so the panel can report it without inferring it.
 */
export interface OnboardingEligibility {
  readonly mode: OpsSchoolAdminInviteMode;
  readonly accountStatus: string | null;
  readonly onboardingStatus: string | null;
  readonly canSend: boolean;
  readonly canResend: boolean;
  readonly canRevoke: boolean;
  readonly contactName: string | null;
  readonly contactEmail: string | null;
}

export function onboardingEligibility(state: SchoolInvitationState): OnboardingEligibility {
  const mode = getOpsSchoolAdminInviteMode(state.onboarding_status);
  const contactName =
    [state.contact_first_name, state.contact_last_name]
      .map((part) => (part ?? '').trim())
      .filter((part) => part !== '')
      .join(' ') || null;
  const contactEmail = (state.contact_email ?? '').trim() || null;
  return {
    mode,
    accountStatus: state.account_status,
    onboardingStatus: state.onboarding_status,
    canSend: mode !== 'onboarding_pending',
    // The server refuses a resend with no stored address (ValidationError, 400).
    // Offering the button anyway would be a dead control, so the absent contact
    // disables it instead of turning a click into an error toast.
    canResend: mode === 'onboarding_pending' && contactEmail !== null,
    canRevoke: mode === 'onboarding_pending',
    contactName,
    contactEmail,
  };
}

/**
 * The route carries `global::is-ops` plus the ops-only grant, so a wrong-role
 * token answers 403 and no client-side filter is needed. The body is parsed
 * through the SHARED contract schema — a drifted server shape throws here
 * instead of rendering as a silently empty panel.
 */
async function fetchOnboardingRead(documentId: string): Promise<SchoolInvitationState> {
  const res = await strapi.get<unknown>(`/api/schools/${documentId}/onboarding-invitation`, {
    opsPortalVersioned: true,
  });
  return parseDataEnvelope(schoolInvitationStateSchema, res.data);
}

export function useOnboardingReadQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: onboardingReadQueryKey(documentId),
    queryFn: () => fetchOnboardingRead(documentId),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
