'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { rosterChildSchema } from '@/modules/teach/schemas/roster.schema';
import type { RosterChild } from '@/modules/teach/types/roster.types';

export const CLASS_ROSTER_QUERY_KEY = ['teach', 'roster'] as const;

// C-CHD-01 teacher-scoped roster for one class: the server intersects the
// class filter with class.teacher = caller, so a class the teacher does not
// own returns an empty page rather than leaking another teacher's students.
// pageSize 100 is the contract maximum.
async function fetchClassRoster(classDocumentId: string): Promise<RosterChild[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/children', {
    params: { class: classDocumentId, pageSize: 100 },
  });
  return res.data.data.map((row) => rosterChildSchema.parse(row));
}

export function useClassRosterQuery(classDocumentId: string) {
  return useQuery({
    queryKey: [...CLASS_ROSTER_QUERY_KEY, classDocumentId],
    queryFn: () => fetchClassRoster(classDocumentId),
  });
}
