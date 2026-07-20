'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { buildStudentPayload } from '@/modules/student-wizard/lib/build-student-payload';
import { createStudentResponseSchema } from '@/modules/student-wizard/schemas/student-create.schema';
import type { StudentWizardOutput } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { CreateStudentResponse } from '@/modules/student-wizard/schemas/student-create.schema';

// C-STUDENT-CREATE: POST /api/students { data } (parent write path — the
// controller injects `parent=<caller>` and forces `status='active'`, rejecting
// any ownership keys). The body is built by construction so only whitelist keys
// ship. On success invalidate the EXISTING dashboard students key so the list
// refetches (no divergent `['students']` key).
async function createStudentRequest(
  values: StudentWizardOutput,
): Promise<CreateStudentResponse['data']> {
  const data = buildStudentPayload(values);
  const res = await strapi.post('/api/students', { data });
  return createStudentResponseSchema.parse(res.data).data;
}

export function useCreateStudentFullMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStudentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'students'] });
    },
  });
}
