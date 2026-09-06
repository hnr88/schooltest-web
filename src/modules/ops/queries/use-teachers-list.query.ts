'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  teachersListResponseSchema,
  type TeachersListQuery,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import type { OpsTeacherRow } from '@/modules/ops/types/ops.types';
import type { OpsTeachersListResult } from '@/modules/ops/types/teachers-list.types';

/**
 * C-OPS-PORTAL-021 (OPS-031) — the VERSIONED ops staff directory read, and the
 * ONE hook for this endpoint (task 02 deleted the unversioned duplicate; the
 * edit/remove mutations below ride in the same file so their invalidations
 * cannot drift from this key). `opsPortalVersioned: true` selects the paginated
 * `data`/`meta` contract; an unversioned caller of the same route still
 * receives the legacy array shape it always has (D-COMPAT) — the header is a
 * wire-shape switch, never an authorization one.
 *
 * The body is parsed through the SHARED response schema before it reaches the
 * UI, so a drifted projection throws `RestContractViolation` here instead of
 * rendering as a silently empty column.
 */
/**
 * Deliberately PREFIXED with the legacy `opsTeachersQueryKey`, because
 * TanStack invalidation is prefix-matched: the existing edit and remove
 * mutations already invalidate `['ops','schools',id,'teachers']`, so every
 * cached portal page of that school is dropped by the writes that exist today —
 * no second invalidation path, and no page left describing a moved account.
 */
export function teachersListSchoolKey(schoolDocumentId: string) {
  return ['ops', 'schools', schoolDocumentId, 'teachers'] as const;
}

export function teachersListQueryKey(schoolDocumentId: string, query: TeachersListQuery) {
  return [...teachersListSchoolKey(schoolDocumentId), 'portal-v1', query] as const;
}

async function fetchTeachersList(
  schoolDocumentId: string,
  query: TeachersListQuery,
): Promise<OpsTeachersListResult> {
  const res = await strapi.get(`/api/ops/schools/${schoolDocumentId}/teachers`, {
    params: query,
    opsPortalVersioned: true,
  });
  const parsed = teachersListResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useTeachersListQuery(
  schoolDocumentId: string,
  query: TeachersListQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: teachersListQueryKey(schoolDocumentId, query),
    queryFn: () => fetchTeachersList(schoolDocumentId, query),
    enabled,
    retry: false,
    // Paging and typing a search must not blank the table between requests —
    // the previous page stays visible until the next one resolves.
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export interface OpsTeacherPatch {
  first_name?: string;
  last_name?: string;
  email?: string;
}

async function patchOpsTeacher({
  schoolDocumentId,
  teacherDocumentId,
  ...patch
}: OpsTeacherPatch & { schoolDocumentId: string; teacherDocumentId: string }): Promise<OpsTeacherRow> {
  const res = await strapi.patch<{ data: OpsTeacherRow }>(
    `/api/ops/schools/${schoolDocumentId}/teachers/${teacherDocumentId}`,
    patch,
  );
  return res.data.data;
}

/** OPS edit — the exact C-TCH-04 whitelist (API 400s anything else). */
export function useOpsTeacherUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchOpsTeacher,
    onSuccess: async (_row, input) => {
      await queryClient.invalidateQueries({
        queryKey: teachersListSchoolKey(input.schoolDocumentId),
      });
    },
  });
}

async function removeOpsTeacher({
  schoolDocumentId,
  teacherDocumentId,
}: {
  schoolDocumentId: string;
  teacherDocumentId: string;
}): Promise<void> {
  await strapi.delete(`/api/ops/schools/${schoolDocumentId}/teachers/${teacherDocumentId}`);
}

/**
 * OPS removal — the C-TCH-03 revocation sequence (block + unlink + drop class
 * links + revoke invitations). Also refreshes the schools directory cache
 * (prefix match) because the detail page's teacher count card reads from it.
 */
export function useOpsTeacherRemoveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeOpsTeacher,
    onSuccess: async (_void, input) => {
      await queryClient.invalidateQueries({
        queryKey: teachersListSchoolKey(input.schoolDocumentId),
      });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}

/**
 * OPS-016 suspend / reactivate.
 *
 * The account endpoints are user-scoped (`/api/ops/users/:documentId`), not
 * school-scoped, because being suspended is a property of the ACCOUNT rather
 * than of one membership — the same call reaches an admin and a teacher, and
 * the server holds the owner, last-admin and self-block invariants so a direct
 * API call cannot break them either.
 *
 * Suspension deliberately does NOT touch class assignments: a suspended teacher
 * keeps their classes so reactivating them restores a working account rather
 * than an empty one.
 */
export async function setOpsStaffBlocked(
  documentId: string,
  blocked: boolean,
  signal?: AbortSignal,
): Promise<void> {
  await strapi.post(
    `/api/ops/users/${documentId}/${blocked ? 'block' : 'unblock'}`,
    undefined,
    { signal },
  );
}

/**
 * The Rule 7 read-back for a suspension: the write is done only when an
 * authorized READ says so. The block endpoint echoes the updated row in its own
 * response, and that echo proves nothing — it is the write describing itself —
 * so this is a separate GET of the account.
 */
export async function readBackOpsStaffBlocked(
  documentId: string,
  expected: boolean,
): Promise<boolean> {
  const res = await strapi.get<{ data: { blocked: boolean } }>(`/api/ops/users/${documentId}`);
  return res.data.data.blocked === expected;
}

/**
 * The Rule 7 read-back for a removal. `removeTeacher` is revocation, not
 * deletion: it blocks the account and severs the school relation. Proving the
 * severed relation is what distinguishes a completed removal from a suspension,
 * so the account being gone FROM THIS SCHOOL is what is read back — not merely
 * that the row still exists.
 */
export async function readBackOpsTeacherRemoved(
  schoolDocumentId: string,
  documentId: string,
): Promise<boolean> {
  const res = await strapi.get<{ data: { school: { documentId: string } | null } }>(
    `/api/ops/users/${documentId}`,
  );
  return res.data.data.school?.documentId !== schoolDocumentId;
}

/** Single-row suspend / reactivate, sharing the list invalidation above. */
export function useOpsStaffBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      blocked,
    }: {
      schoolDocumentId: string;
      documentId: string;
      blocked: boolean;
    }) => setOpsStaffBlocked(documentId, blocked),
    onSuccess: async (_void, input) => {
      await queryClient.invalidateQueries({
        queryKey: teachersListSchoolKey(input.schoolDocumentId),
      });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'staff-users'] });
    },
  });
}
