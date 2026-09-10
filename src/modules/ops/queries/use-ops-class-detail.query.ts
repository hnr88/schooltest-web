'use client';

import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { opsClassDetailSchema, type OpsClassDetail } from '@/modules/ops/schemas/ops-class-detail.schema';

// C-OPS-CLASS-DETAIL — GET /api/ops/schools/:documentId/classes/:classDocumentId.
//
// ROW 20 MOVED THIS OFF THE CORE ROUTE (D-11). It previously read
// `/api/classes/:id` — the ops-only core `findOne` — with a hand-built relation
// query string appended for students, teacher, school and window. That was the
// drift: the core entity route is not the ops surface. This route IS —
// (the old query string is quoted nowhere in this file on purpose: the row's
// own acceptance gate is a NEGATIVE grep for it, and prose that names the thing
// being removed fails a gate that is looking at code)
// it is documented, carries the `global::is-ops` policy and its own grant, and
// needs NO populate string, so there is no query-string shape for a caller to
// get wrong.
//
// It also does not serve a `students` array by design; the roster is its own
// paginated read (`use-class-roster.query.ts`). `student_count` here is the
// TRUE total, where the old populate-limited `students.length` was only as
// large as the populate happened to return.
//
// A 404 (unknown school, or a class that is not in that school) is the screen's
// not-found state and resolves to null; every other failure rethrows so the
// error branch shows rather than a silently empty page (the C-CLS-05
// discipline). Tenancy: a class of another school is that same 404, never a
// 403, so the route leaks no existence across tenants.
// The key stays keyed on the CLASS alone, deliberately unchanged by row 20:
// `documentId` is already globally unique, so adding the school would buy no
// uniqueness while breaking every existing invalidation call site — including
// `use-ops-update-class.mutation.ts`, which is not this row's file to edit.
// The school is needed for the PATH, not for the cache identity.
export function opsClassDetailQueryKey(classDocumentId: string) {
  return ['ops', 'classes', classDocumentId] as const;
}

async function fetchOpsClassDetail(
  schoolDocumentId: string,
  classDocumentId: string,
): Promise<OpsClassDetail | null> {
  try {
    const res = await strapi.get<StrapiSingleResponse<unknown>>(
      `/api/ops/schools/${schoolDocumentId}/classes/${classDocumentId}`,
    );
    return opsClassDetailSchema.parse(res.data.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export function useOpsClassDetailQuery(
  schoolDocumentId: string,
  classDocumentId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: opsClassDetailQueryKey(classDocumentId),
    queryFn: () => fetchOpsClassDetail(schoolDocumentId, classDocumentId),
    enabled: enabled && Boolean(schoolDocumentId) && Boolean(classDocumentId),
    staleTime: 0,
    retry: false,
  });
}
