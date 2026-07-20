'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { buildStudentPayload } from '@/modules/student-wizard';
import type { StudentWizardOutput } from '@/modules/student-wizard';

interface UpdateStudentVars {
  documentId: string;
  values: StudentWizardOutput;
}

// C-STUDENT-UPDATE: PUT /api/students/:documentId { data } — the parent write
// path (owner asserted server-side, `status` stripped). The edit wizard reuses
// the create schema, so the same by-construction payload builder ships only
// whitelist keys. On success invalidate the ['dashboard','students'] prefix so
// the list + detail refetch.
async function updateStudentRequest({ documentId, values }: UpdateStudentVars): Promise<void> {
  const data = buildStudentPayload(values);
  await strapi.put(`/api/students/${documentId}`, { data });
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStudentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'students'] });
    },
  });
}
