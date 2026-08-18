'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { schoolClassSchema } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students';

import type { UpdateClassInput } from '@/modules/classes/types/queries.types';

// C-CLS-03: rename / re-assign. The edit modal sends ONLY name + the single
// teacher — the roster is never touched here (CSV import owns it).
async function updateClassRequest({ documentId, ...values }: UpdateClassInput): Promise<SchoolClass> {
  const res = await strapi.patch<StrapiSingleResponse<unknown>>(
    `/api/schools/me/classes/${documentId}`,
    values,
  );
  return schoolClassSchema.parse(res.data.data);
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClassRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
    },
  });
}
