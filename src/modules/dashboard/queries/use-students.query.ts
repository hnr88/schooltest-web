'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { studentsResponseSchema } from '@/modules/dashboard/schemas/student.schema';
import type { StudentsResponse } from '@/modules/dashboard/types/student.types';

// C-STUDENT-LIST: the /my/* convention route — the controller forces
// filters[parent][documentId][$eq]=<caller> server-side, so this always
// returns only the signed-in parent's own students.
async function fetchStudents(): Promise<StudentsResponse> {
  const res = await strapi.get('/api/my/students', {
    params: {
      sort: ['createdAt:desc'],
      pagination: { pageSize: 100 },
    },
  });
  return studentsResponseSchema.parse(res.data);
}

export function useStudentsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'students'],
    queryFn: fetchStudents,
    staleTime: 30_000,
  });
}
