'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASSES_QUERY_KEY } from '@/modules/classes/queries/use-school-classes.query';
import { schoolClassSchema } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

export interface CreateClassInput {
  name: string;
  year_band: string;
  teacher_documentIds: string[];
}

// C-CLS-02: create the class inside the caller's own school (the school comes
// from the session server-side, never from the body).
async function createClassRequest(input: CreateClassInput): Promise<SchoolClass> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/schools/me/classes', input);
  return schoolClassSchema.parse(res.data.data);
}

export function useCreateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClassRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY }),
  });
}
