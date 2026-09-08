'use client';

import { useQuery } from '@tanstack/react-query';
import {
  viewAsTeacherPath,
  viewAsTeacherSchema,
  type ViewAsTeacher,
} from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { viewAsTeacherQueryKey } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 11c — C-OPS-04c GET /api/ops/view-as-teacher/:documentId, ops only.
 *
 * IMPERSONATION, AND IT IS RECORDED. Every successful call writes an
 * `api::audit-log` row (`action: 'view_as_teacher'`, actor + target +
 * timestamp) — proven live: one call moved the `audit_logs` count for that
 * action from 1 to 2, with the target column carrying the teacher's
 * documentId. Two consequences this hook is built around:
 *
 *  1. it must fire ONLY on an explicit operator action. The panel that owns it
 *     mounts on click, so `enabled` is the panel's own presence; nothing here
 *     fetches with the page;
 *  2. nothing is cached (`gcTime: 0`) — a teacher-scoped payload must not sit
 *     in the client cache after the operator closes the panel, and a re-open is
 *     a new access that SHOULD leave its own audit row rather than being served
 *     silently from memory.
 */
async function fetchViewAsTeacher(
  teacherDocumentId: string,
  signal: AbortSignal,
): Promise<ViewAsTeacher> {
  const res = await strapi.get<unknown>(viewAsTeacherPath(teacherDocumentId), { signal });
  return parseDataEnvelope(viewAsTeacherSchema, res.data);
}

export function useViewAsTeacherQuery(teacherDocumentId: string | null) {
  return useQuery({
    queryKey: viewAsTeacherQueryKey(teacherDocumentId ?? ''),
    queryFn: ({ signal }) => fetchViewAsTeacher(teacherDocumentId ?? '', signal),
    enabled: Boolean(teacherDocumentId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}
