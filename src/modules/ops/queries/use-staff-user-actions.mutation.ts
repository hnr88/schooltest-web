'use client';

import { z } from 'zod';

import {
  legacyStaffUserRowSchema,
  parseDataEnvelope,
  staffInvitationsResponseSchema,
  type LegacyStaffUserRow,
  type StaffInvitationsQuery,
  type StaffUserRole,
} from '@schooltest/ops-contracts';

import { restFailureOf, strapi } from '@/lib/axios/strapi';
import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';

/**
 * task 15 — the first web consumers of C-OPS-USER-BLOCK / -UNBLOCK / -ROLE /
 * -REMOVE (contracts/staff.md). All four routes already exist
 * (`schooltest-api/src/api/ops/routes/05-custom-ops-users.ts`); nothing here
 * changes the server.
 *
 * Every one of the four answers through the service's LEGACY `project()`
 * projection — `setBlocked`, `setRole` and `remove`
 * (schooltest-api/src/api/ops/services/users.ts) all call `project`, never
 * `projectPortalUser`, regardless of `X-Ops-Portal-Version`. Parsing these
 * bodies against the versioned `staffUserRowSchema` (the shape the LIST
 * endpoint answers with) would throw on every call — it requires
 * `updatedAt`/`display_name`/`teaching_specialty`/`last_active_at`, none of
 * which these three responses carry. `legacyStaffUserRowSchema` is the
 * accurate contract for THESE responses.
 */

const STAFF_USER_DETAIL_SUBSET_SCHEMA = z
  .object({ documentId: z.string(), blocked: z.boolean(), role: z.string().nullable() })
  .passthrough();

/**
 * `GET /api/ops/users/:documentId` (C-OPSU-02) — not one of this task's four
 * owned endpoints, but already existing and ops-only gated. Used ONLY as the
 * action kit's read-back proof: a write is done only once it is visible
 * through an authorized read, never assumed from the write's own 2xx.
 */
async function fetchStaffUserDetail(
  documentId: string,
): Promise<{ documentId: string; blocked: boolean; role: string | null }> {
  const res = await strapi.get<{ data: unknown }>(`/api/ops/users/${documentId}`);
  return STAFF_USER_DETAIL_SUBSET_SCHEMA.parse(res.data.data);
}

/** False once C-OPS-USER-REMOVE has actually taken — the detail read 404s. */
async function staffUserExists(documentId: string): Promise<boolean> {
  try {
    await fetchStaffUserDetail(documentId);
    return true;
  } catch (error) {
    const failure = restFailureOf(error);
    if (failure?.kind === 'contract' && failure.status === 404) return false;
    throw error;
  }
}

async function setStaffUserBlocked(documentId: string, blocked: boolean): Promise<LegacyStaffUserRow> {
  const res = await strapi.post<unknown>(
    `/api/ops/users/${documentId}/${blocked ? 'block' : 'unblock'}`,
    {},
  );
  return parseDataEnvelope(legacyStaffUserRowSchema, res.data);
}

/** C-OPS-USER-BLOCK — the design's Suspend admin / Suspend teacher. */
export async function blockStaffUser(documentId: string): Promise<LegacyStaffUserRow> {
  return setStaffUserBlocked(documentId, true);
}

/** C-OPS-USER-UNBLOCK — the design's Reactivate admin / Reactivate teacher. */
export async function unblockStaffUser(documentId: string): Promise<LegacyStaffUserRow> {
  return setStaffUserBlocked(documentId, false);
}

/** C-OPS-USER-ROLE — the design's Edit access for an ACCEPTED account. */
export async function setStaffUserRole(
  documentId: string,
  role: StaffUserRole,
): Promise<LegacyStaffUserRow> {
  const res = await strapi.post<unknown>(`/api/ops/users/${documentId}/role`, { role });
  return parseDataEnvelope(legacyStaffUserRowSchema, res.data);
}

const REMOVE_STAFF_USER_RESULT_SCHEMA = z.strictObject({
  documentId: z.string(),
  deleted: z.boolean(),
});
export type RemoveStaffUserResult = z.infer<typeof REMOVE_STAFF_USER_RESULT_SCHEMA>;

/** C-OPS-USER-REMOVE — the design's Remove from school. Never cascade-deletes
 * authored content: the server refuses (409/400) a user who owns students or
 * classes rather than orphaning their records. */
export async function removeStaffUser(documentId: string): Promise<RemoveStaffUserResult> {
  const res = await strapi.delete<unknown>(`/api/ops/users/${documentId}`);
  return parseDataEnvelope(REMOVE_STAFF_USER_RESULT_SCHEMA, res.data);
}

/* ------------------------------------------------------------------ *
 * OpsActionDefinition builders — the shape `useOpsActionRunner` (task 03)
 * dispatches, for both the row menu and the bulk bar. There is no bulk
 * endpoint: a bulk action is one of these run N times.
 * ------------------------------------------------------------------ */

export const STAFF_USER_BLOCK_ACTION: OpsActionDefinition<OpsActionTarget> = {
  write: true,
  async perform(target) {
    await blockStaffUser(target.documentId);
  },
  async readBack(target) {
    return (await fetchStaffUserDetail(target.documentId)).blocked === true;
  },
  async isEligible(target) {
    try {
      return (await fetchStaffUserDetail(target.documentId)).blocked === false;
    } catch {
      return false;
    }
  },
};

export const STAFF_USER_UNBLOCK_ACTION: OpsActionDefinition<OpsActionTarget> = {
  write: true,
  async perform(target) {
    await unblockStaffUser(target.documentId);
  },
  async readBack(target) {
    return (await fetchStaffUserDetail(target.documentId)).blocked === false;
  },
  async isEligible(target) {
    try {
      return (await fetchStaffUserDetail(target.documentId)).blocked === true;
    } catch {
      return false;
    }
  },
};

export const STAFF_USER_REMOVE_ACTION: OpsActionDefinition<OpsActionTarget> = {
  write: true,
  async perform(target) {
    await removeStaffUser(target.documentId);
  },
  async readBack(target) {
    return !(await staffUserExists(target.documentId));
  },
  async isEligible(target) {
    return staffUserExists(target.documentId);
  },
};

/** Parameterised by the target role: Admins sets `'school_admin'` only. */
export function staffUserSetRoleAction(role: StaffUserRole): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await setStaffUserRole(target.documentId, role);
    },
    async readBack(target) {
      return (await fetchStaffUserDetail(target.documentId)).role === role;
    },
  };
}

/* ------------------------------------------------------------------ *
 * The pending-invitation half of the merged Admins list (C-OPS-PORTAL-016,
 * owner task 19). Resend/revoke themselves are NOT this task's endpoints —
 * `resendStaffInvitation`/`revokeStaffInvitation`
 * (queries/use-{resend,revoke}-invitation.mutation.ts) already exist for
 * exactly this — this file only adds the read-back this action-kit
 * definition needs, since `GET /api/ops/invitations/:documentId` does not
 * exist: the list is the only authorized read. Bounded proof, stated plainly:
 * resend's read-back confirms the invitation is still live (`invited`), which
 * is what a resend must never break; revoke's confirms the terminal state
 * `revoked` precisely, since the row is never deleted.
 */
async function fetchStaffInvitationStatus(
  params: StaffInvitationsQuery,
  documentId: string,
): Promise<string | null> {
  const res = await strapi.get<unknown>('/api/ops/invitations', {
    params,
    opsPortalVersioned: true,
  });
  const parsed = staffInvitationsResponseSchema.parse(res.data);
  return parsed.data.find((row) => row.documentId === documentId)?.status ?? null;
}

export function staffInvitationResendAction(
  resend: (documentId: string) => Promise<unknown>,
  listParams: StaffInvitationsQuery,
): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await resend(target.documentId);
    },
    async readBack(target) {
      return (await fetchStaffInvitationStatus(listParams, target.documentId)) === 'invited';
    },
    async isEligible(target) {
      const status = await fetchStaffInvitationStatus(listParams, target.documentId);
      return status === 'invited' || status === 'expired';
    },
  };
}

export function staffInvitationRevokeAction(
  revoke: (documentId: string) => Promise<unknown>,
  listParams: StaffInvitationsQuery,
): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await revoke(target.documentId);
    },
    async readBack(target) {
      return (await fetchStaffInvitationStatus(listParams, target.documentId)) === 'revoked';
    },
    async isEligible(target) {
      const status = await fetchStaffInvitationStatus(listParams, target.documentId);
      return status === 'invited' || status === 'expired';
    },
  };
}
