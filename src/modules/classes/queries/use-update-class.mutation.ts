'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASS_CHILDREN_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { schoolClassSchema, type ClassFormValues } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students';

import type { UpdateClassInput } from '@/modules/classes/types/queries.types';

// C-CLS-03: rename / re-band / re-assign. student_documentIds is REPLACE
// semantics server-side: unlisted members are unlinked, never deleted.
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
      // Student assignment moved students between classes, so the picker
      // source (current class per student) is stale too — both the classes
      // module picker list and the school-students roster (detail screen).
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CLASS_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
    },
  });
}
