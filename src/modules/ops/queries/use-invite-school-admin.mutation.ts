'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  /** The single pictured Name field. May be blank — the email greets the mailbox. */
  display_name: string;
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
 * `access_model: 'managed_admins'` is what allows a school a second admin;
 * the server still owns the single-owner invariant.
 */
async function inviteStaff(input: InviteStaffInput): Promise<StaffInviteResult> {
  const path = input.role === 'school_admin' ? 'admin-invitations' : 'teacher-invitations';
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/${path}`,
    {
      display_name: input.display_name,
      email: input.email,
      access_model: 'managed_admins',
      ...(input.message === undefined || input.message === '' ? {} : { message: input.message }),
    },
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
