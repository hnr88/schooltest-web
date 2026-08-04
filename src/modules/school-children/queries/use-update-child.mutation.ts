'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-children/constants/queries.constants';
import { schoolChildDetailSchema } from '@/modules/school-children/schemas/school-child.schema';
import type {
  ChildWriteBody,
  SchoolChildDetail,
} from '@/modules/school-children/types/school-children.types';

import type { UpdateChildInput } from '@/modules/school-children/types/queries.types';

// C-CHD-03: partial whitelist write-back; class_documentId: null unassigns.
async function updateChildRequest({ documentId, body }: UpdateChildInput): Promise<SchoolChildDetail> {
  const res = await strapi.patch<StrapiSingleResponse<unknown>>(
    `/api/schools/me/children/${documentId}`,
    body,
  );
  return schoolChildDetailSchema.parse(res.data.data);
}

export function useUpdateChildMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateChildRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY }),
  });
}
