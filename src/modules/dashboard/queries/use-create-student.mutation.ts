'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  createStudentResponseSchema,
  type AddStudentInput,
} from '@/modules/dashboard/schemas/add-student.schema';
import type { Student } from '@/modules/dashboard/types/student.types';

// C-STUDENT-CREATE: POST /api/students (parent write path — the controller
// injects `parent=<caller>` server-side and rejects any ownership keys the
// client sends). email is only included when the parent actually set one —
// the api treats it as optional, not `""`.
async function createStudentRequest(input: AddStudentInput): Promise<Student> {
  const data: Record<string, unknown> = {
    given_name: input.given_name,
    family_name: input.family_name,
    year_level: input.year_level,
  };
  if (input.email) data.email = input.email;

  const res = await strapi.post('/api/students', { data });
  return createStudentResponseSchema.parse(res.data).data;
}

export function useCreateStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStudentRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'students'] });
    },
  });
}
