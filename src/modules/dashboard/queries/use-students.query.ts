'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { studentsResponseSchema } from '@/modules/dashboard/schemas/student.schema';
import type { StudentListRow, StudentsResponse } from '@/modules/dashboard/types/student.types';

// Every status, used by the "Include archived" chip (C-UI-MYCHILDREN) to widen
// past the server's default `status $ne 'archived'` filter.
const ALL_STATUSES = ['active', 'archived', 'enrolled'] as const;

interface UseStudentsOptions {
  includeArchived?: boolean;
}

// C-STUDENT-LIST-EXT: the /my/* convention route — the controller forces
// filters[parent][documentId][$eq]=<caller> server-side, so this always returns
// only the signed-in parent's own students. By default archived rows are
// excluded server-side; passing `filters[status][$in]` re-includes them.
async function fetchStudentsPage(includeArchived: boolean, page = 1): Promise<StudentsResponse> {
  const res = await strapi.get('/api/my/students', {
    params: {
      sort: ['createdAt:desc'],
      pagination: { page, pageSize: 100 },
      ...(includeArchived ? { filters: { status: { $in: ALL_STATUSES } } } : {}),
    },
  });
  return studentsResponseSchema.parse(res.data);
}

async function fetchAllCurrentStudents(): Promise<StudentListRow[]> {
  const firstPage = await fetchStudentsPage(false);
  const pagination = firstPage.meta.pagination;

  if (!pagination || pagination.pageCount <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pagination.pageCount - 1 }, (_, index) =>
      fetchStudentsPage(false, index + 2),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((pageResult) => pageResult.data);
}

export function useStudentsQuery({ includeArchived = false }: UseStudentsOptions = {}) {
  return useQuery({
    // Single source under the ['dashboard','students'] prefix (C-UI-MYCHILDREN) —
    // create/update/archive mutations invalidate the prefix, refetching both the
    // default and include-archived variants together.
    queryKey: ['dashboard', 'students', { includeArchived }],
    queryFn: () => fetchStudentsPage(includeArchived),
    staleTime: 30_000,
  });
}

export function useDashboardOverviewStudentsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'students', { scope: 'overview' }],
    queryFn: fetchAllCurrentStudents,
    staleTime: 30_000,
  });
}
