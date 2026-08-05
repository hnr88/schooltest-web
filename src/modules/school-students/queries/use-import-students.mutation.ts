'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import {
  ENTITLEMENT_QUERY_KEY,
  SCHOOL_CHILDREN_QUERY_KEY,
} from '@/modules/school-students/constants/queries.constants';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import { buildImportStudentBody } from '@/modules/school-students/lib/import-student-body';

import type {
  ImportStudentsInput,
  ImportStudentsResult,
} from '@/modules/school-students/types/queries.types';

// Spec §4 "Import students": every parsed row is created through C-CHD-02, the
// school_admin write. The teacher-only roster routes are never touched here —
// they answer 403 to this caller. Rows settle independently so one rejected row
// (duplicate email, seat cap reached mid-batch) never discards the rest; the
// first rejection is classified so the caller can name the reason.
async function importStudentsRequest({
  rows,
  classDocumentId,
}: ImportStudentsInput): Promise<ImportStudentsResult> {
  const settled = await Promise.allSettled(
    rows.map((row) =>
      strapi.post<StrapiSingleResponse<unknown>>(
        '/api/schools/me/children',
        buildImportStudentBody(row, classDocumentId),
      ),
    ),
  );
  const rejected = settled.find(
    (entry): entry is PromiseRejectedResult => entry.status === 'rejected',
  );
  return {
    created: settled.filter((entry) => entry.status === 'fulfilled').length,
    total: rows.length,
    failure: rejected ? classifyStudentError(rejected.reason) : null,
  };
}

export function useImportStudentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importStudentsRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
  });
}
