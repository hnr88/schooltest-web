'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { classChildOptionSchema } from '@/modules/classes/schemas/class.schema';
import type { ClassChildOption } from '@/modules/classes/types/classes.types';

export const CLASS_CHILDREN_QUERY_KEY = ['classes', 'school', 'children'] as const;

// C-CHD-01: children of the caller's school, backing the edit-dialog student
// picker. Fetched without a status filter so children already in the class
// (including archived ones) stay checked and survive the PATCH replace
// semantics. pageSize 100 is the contract maximum.
async function fetchClassChildren(): Promise<ClassChildOption[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/children', {
    params: { pageSize: 100 },
  });
  return res.data.data.map((row) => classChildOptionSchema.parse(row));
}

export function useClassChildrenQuery(enabled: boolean) {
  return useQuery({ queryKey: CLASS_CHILDREN_QUERY_KEY, queryFn: fetchClassChildren, enabled });
}
