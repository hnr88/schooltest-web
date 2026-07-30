'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASS_CHILDREN_QUERY_KEY } from '@/modules/classes/queries/use-class-children.query';
import { CLASSES_QUERY_KEY } from '@/modules/classes/queries/use-school-classes.query';
import { schoolClassSchema, type ClassFormValues } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

export interface UpdateClassInput extends ClassFormValues {
  documentId: string;
}

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
      // Student assignment moved children between classes, so the picker
      // source (current class per child) is stale too.
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CLASS_CHILDREN_QUERY_KEY });
    },
  });
}
