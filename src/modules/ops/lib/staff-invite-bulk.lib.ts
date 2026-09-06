import { z } from 'zod';

import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import { strapi } from '@/lib/axios/strapi';
import { resendStaffInvitation } from '@/modules/ops/queries/use-resend-invitation.mutation';

/** The invitation statuses a resend may still act on — terminal states never revive. */
const RESENDABLE = new Set(['invited', 'expired']);

/**
 * Bulk resend for the staff invitations surface (task 15 on the task 05
 * runner). Each selected INVITATION row takes the SAME single-invitation
 * resend the row action uses — token rotation, previous-token invalidation,
 * 14-day expiry and the persisted 429 cooldown included; the runner turns a
 * cooldown into a per-row failed outcome plus cooldown state, never an
 * automatic retry. Targets are invitation rows by construction
 * (`kind: 'invitation'`); an accepted or suspended USER id is never a valid
 * invitation documentId and the read-back refuses it.
 */

/** One authorized status read for a single invitation row (list endpoint, no token). */
async function listInvitationStatuses(
  documentId: string,
): Promise<Array<{ status: string | null }>> {
  const res = await strapi.get<unknown>('/api/ops/invitations', {
    params: { 'filters[documentId][$eq]': documentId, 'pagination[pageSize]': '1' },
  });
  return z
    .strictObject({
      data: z.array(z.strictObject({ status: z.string().nullable() })),
    })
    .parse(res.data).data;
}

export const STAFF_RESEND_INVITATION_ACTION: OpsActionDefinition<OpsActionTarget> = {
  async perform(target) {
    await resendStaffInvitation(target.documentId);
  },
  async readBack(target) {
    const rows = await listInvitationStatuses(target.documentId);
    return rows.length === 1 && rows[0].status === 'invited';
  },
  async isEligible(target) {
    const rows = await listInvitationStatuses(target.documentId);
    return rows.length === 1 && rows[0].status !== null && RESENDABLE.has(rows[0].status);
  },
};
