'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { classStudentOptionSchema } from '@/modules/classes/schemas/class.schema';
import type { ClassStudentOption } from '@/modules/classes/types/classes.types';
import { CLASS_CHILDREN_QUERY_KEY } from '@/modules/classes/constants/queries.constants';

// C-CHD-01: students of the caller's school, backing the edit-dialog student
// picker. Fetched without a status filter so students already in the class
// (including archived ones) stay checked and survive the PATCH replace
// semantics. pageSize 100 is the contract maximum.
async function fetchClassStudents(): Promise<ClassStudentOption[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/children', {
    params: { pageSize: 100 },
  });
  return res.data.data.map((row) => classStudentOptionSchema.parse(row));
}

export function useClassStudentsQuery(enabled: boolean) {
  return useQuery({ queryKey: CLASS_CHILDREN_QUERY_KEY, queryFn: fetchClassStudents, enabled });
}
