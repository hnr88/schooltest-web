'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { schoolClassSchema } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';

// C-CLS-01: classes of the caller's school (school_admin sees all),
// school-scoped server-side; student_count is computed at read.
async function fetchSchoolClasses(): Promise<SchoolClass[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/classes');
  return res.data.data.map((row) => schoolClassSchema.parse(row));
}

export function useSchoolClassesQuery(enabled: boolean) {
  return useQuery({ queryKey: CLASSES_QUERY_KEY, queryFn: fetchSchoolClasses, enabled });
}
