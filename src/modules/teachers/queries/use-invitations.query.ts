'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { schoolInvitationSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { SchoolInvitation } from '@/modules/teachers/types/teachers.types';
import { INVITATIONS_QUERY_KEY } from '@/modules/teachers/constants/queries.constants';

// C-INV-02: invitation rows of the caller's school (invited/expired/accepted),
// school-scoped server-side.
async function fetchInvitations(): Promise<SchoolInvitation[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/invitations');
  return res.data.data.map((row) => schoolInvitationSchema.parse(row));
}

export function useInvitationsQuery(enabled: boolean) {
  return useQuery({ queryKey: INVITATIONS_QUERY_KEY, queryFn: fetchInvitations, enabled });
}
