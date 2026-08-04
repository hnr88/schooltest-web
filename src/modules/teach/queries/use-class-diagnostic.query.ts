'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { classDiagnosticSchema } from '@/modules/teach/schemas/diagnostic.schema';
import type { ClassDiagnostic } from '@/modules/teach/types/diagnostic.types';
import { CLASS_DIAGNOSTIC_QUERY_KEY } from '@/modules/teach/constants/queries.constants';

// C-RPT-01 school-scoped class diagnostic (task 75): the server enforces the
// role gate (teacher | school_admin | ops) and the object scope (teacher must
// sit in the class's teachers), so an unowned class 403s here and the screen
// renders its error state rather than leaking another teacher's class.
async function fetchClassDiagnostic(classDocumentId: string): Promise<ClassDiagnostic> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>(
    `/api/schools/me/classes/${classDocumentId}/diagnostic`
  );
  return classDiagnosticSchema.parse(res.data.data);
}

// Shared options factory (task 78): the school-admin analytics aggregate runs
// the same per-class diagnostic reads through useQueries - identical queryKey
// and queryFn, so the two surfaces share the TanStack cache.
export function classDiagnosticQueryOptions(classDocumentId: string) {
  return {
    queryKey: [...CLASS_DIAGNOSTIC_QUERY_KEY, classDocumentId],
    queryFn: () => fetchClassDiagnostic(classDocumentId),
  } as const;
}

export function useClassDiagnosticQuery(classDocumentId: string) {
  return useQuery(classDiagnosticQueryOptions(classDocumentId));
}
