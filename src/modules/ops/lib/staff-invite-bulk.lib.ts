import type { StaffInvitationsQuery } from '@schooltest/ops-contracts';

import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import { resendStaffInvitation } from '@/modules/ops/queries/use-resend-invitation.mutation';
import { fetchStaffInvitations } from '@/modules/ops/queries/use-staff-invitations.query';

/** The invitation statuses a resend may still act on — terminal states never revive. */
const RESENDABLE = new Set(['invited', 'expired']);

/**
 * Bulk resend for the staff invitations surface (task 15 on the task 05
 * runner; task 19 corrected the read below). Each selected INVITATION row
 * takes the SAME single-invitation resend the row action uses — token
 * rotation, previous-token invalidation, 14-day expiry and the persisted 429
 * cooldown included; the runner turns a cooldown into a per-row failed
 * outcome plus cooldown state, never an automatic retry. Targets are
 * invitation rows by construction (`kind: 'invitation'`); an accepted or
 * suspended USER id is never a valid invitation documentId and the read-back
 * refuses it.
 *
 * task 19 (Law-1 fix, D-25) — the previous local read sent
 * `filters[documentId][$eq]` / `pagination[pageSize]` to
 * `GET /api/ops/invitations` with its own local Zod schema. Both params are
 * Strapi REST filter syntax the CUSTOM ops controller
 * (`schooltest-api/src/api/ops/controllers/invitations.ts#list`) never reads —
 * it only decodes flat `q`/`status`/`school`/`role`/`page`/`pageSize` keys via
 * `parseOps*`. Confirmed live: that call returned the unfiltered, unversioned
 * FIRST PAGE OF ALL INVITATIONS SYSTEM-WIDE (8 rows in the seeded dev DB, none
 * matching the probed documentId), so `rows.length === 1` was false for every
 * real target and the action could never have reported eligible or applied —
 * a silent, always-false control, not a working one.
 *
 * There is no `GET /api/ops/invitations/:documentId` (same limit
 * `use-staff-user-actions.mutation.ts#fetchStaffInvitationStatus` documents
 * for the account actions): the list is the only authorized read, and it must
 * be scoped (`school`, optionally `role`/`status`) to return a bounded page a
 * caller can search — a school-blind read has no correct implementation, only
 * a coincidentally-smaller wrong one. This action is therefore now a FACTORY
 * over the caller's own list scope, the same shape
 * `staffInvitationResendAction`/`staffInvitationRevokeAction`
 * (`use-staff-user-actions.mutation.ts`) already use for the identical
 * problem — reusing `fetchStaffInvitations` (this task's other Law-1 fix)
 * rather than a second axios call and a second schema.
 */
async function invitationStatus(
  listParams: StaffInvitationsQuery,
  documentId: string,
): Promise<string | null> {
  const response = await fetchStaffInvitations(listParams);
  return response.data.find((row) => row.documentId === documentId)?.status ?? null;
}

/**
 * Renamed from the school-blind `STAFF_RESEND_INVITATION_ACTION` constant
 * (see the comment above) — camelCase because this is a function, per the
 * naming convention every other factory in this module tree follows
 * (`staffInvitationResendAction`, `staffUserSetRoleAction`). A `rg` for the
 * old identifier now finds only this file's history comment; a `rg` for this
 * one finds the corrected definition.
 */
export function staffInvitationBulkResendAction(
  listParams: StaffInvitationsQuery,
): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await resendStaffInvitation(target.documentId);
    },
    async readBack(target) {
      return (await invitationStatus(listParams, target.documentId)) === 'invited';
    },
    async isEligible(target) {
      const status = await invitationStatus(listParams, target.documentId);
      return status !== null && RESENDABLE.has(status);
    },
  };
}
