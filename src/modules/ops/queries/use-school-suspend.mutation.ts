'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  schoolArchiveResultSchema,
  schoolLifecycleUndoResultSchema,
  schoolRestoreResultSchema,
  schoolSuspendResultSchema,
  type SchoolArchiveResult,
  type SchoolLifecycleUndoResult,
  type SchoolRestoreResult,
  type SchoolSuspendResult,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { schoolVersionQueryKey } from '@/modules/ops/queries/use-school-version.query';
import type { SchoolSuspendInput } from '@/modules/ops/types/school-suspend.types';

/**
 * C-OPS-PORTAL-005 — POST /api/ops/schools/{documentId}/suspend.
 *
 * `opsPortalVersioned` opts THIS request into the versioned contract, which is
 * what makes `If-Match` mandatory and the extended body available; an ops
 * integration that never sends the header keeps its legacy three-key response.
 * The version is the quoted `updatedAt` the operator's page actually loaded, so
 * a school someone else changed in the meantime answers 412 instead of being
 * suspended from a stale view.
 */
export async function suspendSchool({
  schoolDocumentId,
  version,
}: SchoolSuspendInput): Promise<SchoolSuspendResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/suspend`,
    {},
    { opsPortalVersioned: true, headers: { 'If-Match': version } },
  );
  return schoolSuspendResultSchema.parse(res.data.data);
}

export function useSchoolSuspendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suspendSchool,
    // Both caches move: the school list carries the status chip the operator
    // just changed, and the version query holds the row version the NEXT
    // lifecycle write must quote.
    onSuccess: async (_result, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
    // A rejected write must not leave a stale version behind either: a 412
    // means the row moved, so the panel refetches before offering a retry.
    onError: async (_error, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
    },
  });
}

/* --- task 12: archive, restore and the Undo window ----------------------- */

/** C-OPS-PORTAL-016 — the typed-name half lives in the UI; this body key IS the server's guard. */
export async function archiveSchool({
  schoolDocumentId,
  version,
}: SchoolSuspendInput): Promise<SchoolArchiveResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/archive`,
    { expected_updated_at: version.replace(/"/g, '') },
    { opsPortalVersioned: true },
  );
  return schoolArchiveResultSchema.parse(res.data.data);
}

export function useSchoolArchiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveSchool,
    onSuccess: async (_r, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
    onError: async (_e, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
    },
  });
}

/** C-OPS-PORTAL-017 — restore clears archived_at and enters prospect/not_started. */
async function restoreSchool({ schoolDocumentId, version }: SchoolSuspendInput): Promise<SchoolRestoreResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/restore`,
    {},
    { opsPortalVersioned: true, headers: { 'If-Match': version } },
  );
  return schoolRestoreResultSchema.parse(res.data.data);
}

export function useSchoolRestoreMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreSchool,
    onSuccess: async (_r, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}

interface SchoolUndoInput {
  schoolDocumentId: string;
  actionDocumentId: string;
  version: string;
}

/** C-OPS-PORTAL-018 — the window and latest-action check are server facts. */
async function undoSchoolLifecycleAction({
  schoolDocumentId,
  actionDocumentId,
  version,
}: SchoolUndoInput): Promise<SchoolLifecycleUndoResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/lifecycle-actions/${actionDocumentId}/undo`,
    {},
    { opsPortalVersioned: true, headers: { 'If-Match': version } },
  );
  return schoolLifecycleUndoResultSchema.parse(res.data.data);
}

export function useSchoolUndoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: undoSchoolLifecycleAction,
    onSuccess: async (_r, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
