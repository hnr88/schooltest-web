'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-children/constants/queries.constants';
import { schoolChildDetailSchema } from '@/modules/school-children/schemas/school-child.schema';
import type {
  ChildWriteBody,
  SchoolChildDetail,
} from '@/modules/school-children/types/school-children.types';
import { ENTITLEMENT_QUERY_KEY } from '@/modules/school-children/constants/queries.constants';

// C-CHD-02: create the child inside the caller's own school (the school comes
// from the session server-side, never from the body). The seat gate may 403
// with SEAT_CAP / SCHOOL_INACTIVE — classify-child-error maps those.
async function createChildRequest(body: ChildWriteBody): Promise<SchoolChildDetail> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/schools/me/children', body);
  return schoolChildDetailSchema.parse(res.data.data);
}

export function useCreateChildMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChildRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
  });
}
