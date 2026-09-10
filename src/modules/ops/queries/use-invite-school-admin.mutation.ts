'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffInviteBodySchema } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import {
  adminInvitationResultSchema,
  staffInviteResultSchema,
  type StaffInviteResult,
} from '@/modules/ops/schemas/school-invitation.schema';

import type { InviteSchoolAdminInput } from '@/modules/ops/types/queries.types';
import type { AdminInvitationResult } from '@/modules/ops/types/school-invitation.types';

async function inviteSchoolAdmin({
  schoolDocumentId,
  contact_email,
  ...names
}: InviteSchoolAdminInput): Promise<AdminInvitationResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/admin-invitations`,
    { ...names, email: contact_email },
  );
  return adminInvitationResultSchema.parse(res.data.data);
}

export function useInviteSchoolAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteSchoolAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'invitations'] });
    },
  });
}

export interface InviteStaffInput {
  schoolDocumentId: string;
  role: 'school_admin' | 'teacher';
  /**
   * Task 25 (D-12/D-13) — the design's single "Full name" field, already split
   * into the two required columns on the form side. `last_name` is never
   * blank: a single-token name fills both, so the wire never sees an empty
   * NOT-NULL column.
   */
  first_name: string;
  last_name: string;
  email: string;
  message?: string;
}

/**
 * The VERSIONED staff invite, for both roles.
 *
 * One hook for both endpoints on purpose: `admin-invitations` and
 * `teacher-invitations` are the same operation with the role forced
 * server-side, so giving them separate hooks would be the duplication house
 * rule 1 forbids — and would let the two drift apart on the client the way
 * they had drifted on the server.
 *
 * Task 25 (D-13) — the request body is now the ONE shared `StaffInviteBody`
 * shape (`staffInviteBodySchema`, `@schooltest/ops-contracts`), imported
 * rather than re-declared: `{ email, first_name, last_name, message? }`. The
 * server's own `X-Ops-Portal-Version` header (sent below) still selects
 * `access_model: 'managed_admins'` and the `delivery` outcome server-side —
 * that plumbing is internal to the controller/service pair and never part of
 * this wire shape.
 */
async function inviteStaff(input: InviteStaffInput): Promise<StaffInviteResult> {
  const path = input.role === 'school_admin' ? 'admin-invitations' : 'teacher-invitations';
  const body = staffInviteBodySchema.parse({
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    ...(input.message === undefined || input.message === '' ? {} : { message: input.message }),
  });
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/${path}`,
    body,
    { opsPortalVersioned: true },
  );
  return staffInviteResultSchema.parse(res.data.data);
}

export function useInviteStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteStaff,
    // Both directories move: the invitation list gains a row, and the staff
    // list is what the person joins once they accept.
    onSuccess: async (_result, input) => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'invitations'] });
      await queryClient.invalidateQueries({
        queryKey: ['ops', 'staff-users', input.schoolDocumentId],
      });
    },
  });
}
