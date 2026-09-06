'use client';

import { isAxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  schoolPatchResponseSchema,
  schoolWriteResultSchema,
  type SchoolCreate,
  type SchoolWriteResult,
} from '@schooltest/ops-contracts';

import { idempotencyHeaders, strapi } from '@/lib/axios/strapi';
import type { SchoolCreateInput } from '@/modules/ops/types/school-create.types';

/**
 * C-OPS-PORTAL-003 — POST /api/schools (versioned create).
 *
 * `opsPortalVersioned` opts THIS request into the versioned contract; an ops
 * integration that never sends the header keeps the legacy forced-trial shape.
 * The Idempotency-Key makes the operator's retry safe: same key + same body
 * replays the original 201, same key + a different body is a 409 the dialog
 * surfaces inline. Empty optional selects are omitted entirely — the contract
 * marks them nullish, and absent is cleaner than null for "not chosen".
 */
async function createSchool(input: SchoolCreateInput): Promise<SchoolWriteResult> {
  const { values } = input;
  const body: SchoolCreate = {
    name: values.name,
    suburb: values.suburb,
    contact_name: values.contact_name,
    contact_email: values.contact_email,
    ...(values.state ? { state: values.state } : {}),
    ...(values.sector ? { sector: values.sector } : {}),
    ...(values.phone ? { phone: values.phone } : {}),
    portal: {
      plan: values.plan,
      status: values.status,
      send_owner_invitation: true,
    },
  };
  const res = await strapi.post<{ data: unknown }>('/api/schools', body, {
    opsPortalVersioned: true,
    headers: idempotencyHeaders(input.idempotencyKey),
  });
  return schoolWriteResultSchema.parse(res.data.data);
}

export function useSchoolCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchool,
    // The new row belongs on the schools list the dialog floats over.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}

export interface SchoolEditPayload {
  documentId: string;
  patch: Record<string, unknown>;
  /** Quoted updatedAt of the school as the operator's page loaded it. */
  ifMatch: string;
}

/**
 * C-OPS-PORTAL-004 — PATCH /api/schools/{documentId} (task 10, versioned edit).
 * STALE IS SURFACED, NEVER RETRIED: a 412 is mapped to the honest
 * user-visible state by the caller, which keeps the draft in the form. The
 * response is the SAME SchoolWriteResult projection the create returns.
 */
async function editSchool(input: SchoolEditPayload): Promise<SchoolWriteResult> {
  const res = await strapi.patch<unknown>(`/api/schools/${input.documentId}`, input.patch, {
    opsPortalVersioned: true,
    headers: { 'If-Match': input.ifMatch },
  });
  return schoolPatchResponseSchema.parse(res.data).data;
}

export function useSchoolEditMutation(schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editSchool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}

/** Field issues from the standard 400 envelope, for the form's per-control errors. */
export function schoolFieldIssues(error: unknown): Array<{ path: string; message: string }> {
  if (!isAxiosError(error)) return [];
  const envelope = error.response?.data as
    | { error?: { details?: { errors?: Array<{ path?: string; message?: string }> } } }
    | undefined;
  return (envelope?.error?.details?.errors ?? [])
    .filter((issue) => issue.path && issue.path !== '(root)' && issue.path !== 'If-Match')
    .map((issue) => ({ path: String(issue.path), message: String(issue.message) }));
}

/** True when the write was refused because the school moved under the operator. */
export function schoolStale(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 412;
}
