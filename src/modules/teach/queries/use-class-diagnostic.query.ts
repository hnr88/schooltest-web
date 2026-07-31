'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { classDiagnosticSchema } from '@/modules/teach/schemas/diagnostic.schema';
import type { ClassDiagnostic } from '@/modules/teach/types/diagnostic.types';

export const CLASS_DIAGNOSTIC_QUERY_KEY = ['teach', 'diagnostic'] as const;

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

export function useClassDiagnosticQuery(classDocumentId: string) {
  return useQuery({
    queryKey: [...CLASS_DIAGNOSTIC_QUERY_KEY, classDocumentId],
    queryFn: () => fetchClassDiagnostic(classDocumentId),
  });
}
