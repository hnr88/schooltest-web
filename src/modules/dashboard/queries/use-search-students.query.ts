'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { searchStudentsResponseSchema } from '@/modules/dashboard/schemas/student.schema';
import type { SearchStudentsResponse } from '@/modules/dashboard/types/student.types';

// C-STUDENT-SEARCH: GET /api/search/students?q= — always enabled (an empty q
// returns the caller's recent students per contract), parent-scoped
// server-side. `keepPreviousData` avoids a loading flash between debounced
// keystrokes: the previous result set stays on screen until the next one lands.
async function fetchSearchStudents(query: string): Promise<SearchStudentsResponse> {
  const res = await strapi.get('/api/search/students', { params: { q: query } });
  return searchStudentsResponseSchema.parse(res.data);
}

export function useSearchStudentsQuery(query: string) {
  return useQuery({
    queryKey: ['dashboard', 'search-students', query],
    queryFn: () => fetchSearchStudents(query),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
