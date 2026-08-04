'use client';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { writeClientToken } from '@/lib/axios/strapi';
import { useAcceptInvitationMutation } from '@/modules/invitation/queries/use-accept-invitation.mutation';
import { dashboardHrefForRole } from '@/modules/invitation/lib/role-dashboard';
import type { InviteAcceptValues } from '@/modules/invitation/schemas/invite-accept.schema';

import type { StrapiErrorBody } from '@/modules/invitation/types/hooks.types';

// Accept-submit flow for the /invite/<token> form (C-INV-06): on success the
// returned JWT is stored exactly like a sign-in and the new staff member lands
// on their role's dashboard. The cached C-INV-05 snapshot is dropped so a
// revisit of the link re-fetches and renders the used screen. A 400 surfaces
// the server message inline (or the caller-supplied fallback when the body
// carries none); a 404/410/409 means the link state changed under the guest
// and is surfaced the same way.
export function useAcceptInvite(token: string, fallbackMessage: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useAcceptInvitationMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async (values: InviteAcceptValues) => {
    setServerError(null);
    try {
      const result = await mutation.mutateAsync({
        token,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
      });
      writeClientToken(result.jwt);
      queryClient.removeQueries({ queryKey: ['invitation', token] });
      router.push(dashboardHrefForRole(result.user.role));
    } catch (error) {
      const body = isAxiosError(error) ? (error.response?.data as StrapiErrorBody) : null;
      setServerError(body?.error?.message ?? fallbackMessage);
    }
  };

  return { submit, pending: mutation.isPending, serverError };
}
