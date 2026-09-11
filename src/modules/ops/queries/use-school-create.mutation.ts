'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  schoolPatchResponseSchema,
  schoolsListResponseSchema,
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
 * response is the SAME SchoolWriteResult projection the create returns, with
 * the delivery object pinned to not_requested for a pure edit.
 */
async function editSchool(input: SchoolEditPayload): Promise<SchoolWriteResult> {
  const res = await strapi.patch<unknown>(`/api/schools/${input.documentId}`, input.patch, {
    opsPortalVersioned: true,
    headers: { 'If-Match': input.ifMatch },
  });
  // The legacy PATCH wire carries an extra top-level `meta` key beside
  // `data`; parsing only the `data` member keeps the strict result schema
  // without rejecting the response over the unrelated envelope key (the
  // create path above already does the same).
  const body = res.data as { data?: unknown };
  return schoolPatchResponseSchema.parse({ data: body.data }).data;
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

/**
 * school-admin/04 (U-19): lifted to `@/lib/form-errors`, where the 400 envelope
 * is PARSED against `errorEnvelopeSchema` / `fieldIssueSchema` instead of
 * optional-chained through `unknown`. The names stay as re-exports, so no
 * caller changes.
 */
export { serverIssues as schoolFieldIssues, isStaleWrite as schoolStale } from '@/lib/form-errors';

/**
 * Task 24 (`vSchool`) — the design and this backlog's `logic.md` both assume
 * the server answers 409 on a genuine duplicate name. Curled live against
 * 127.0.0.1:5500 (2026-09-10): a duplicate `name` on POST /api/schools
 * answers **400** `ValidationError`, uniqueness enforced on the derived
 * `slug`, never a 409 — recorded as a defect for `contracts/schools.md`.
 * PATCH's own duplicate-name path is worse (confirmed live): it answers
 * **500** with no field detail and PERSISTS THE RENAME ANYWAY, so it cannot
 * be distinguished from any other 500 here — the async pre-check below is
 * the only real defence on edit.
 */
export function schoolNameConflict(error: unknown): boolean {
  const candidate = error as
    | { response?: { status?: number; data?: { error?: { details?: { errors?: Array<{ path?: unknown }> } } } } }
    | undefined;
  if (candidate?.response?.status !== 400) return false;
  const issues = candidate.response.data?.error?.details?.errors ?? [];
  return issues.some((issue) => issue.path === 'slug' || (Array.isArray(issue.path) && issue.path.includes('slug')));
}

/**
 * Task 24 (`vSchool`, `:1163`) — best-effort duplicate-name pre-check against
 * the live directory. The server's own uniqueness constraint is on `slug`,
 * not `name` (`logic.md#v-school`), so this NEVER replaces the server's
 * answer — it only saves the round trip in the common case. Excludes the
 * school being edited so keeping its own name never fires the rule. A failed
 * or malformed read is swallowed: a broken pre-check must never block a
 * submission the server would accept.
 */
export async function findDuplicateSchoolName(
  name: string,
  excludeDocumentId?: string
): Promise<boolean> {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  try {
    const res = await strapi.get<unknown>('/api/ops/schools', {
      opsPortalVersioned: true,
      params: { q: trimmed, pageSize: 10, page: 1 },
    });
    const parsed = schoolsListResponseSchema.safeParse(res.data);
    if (!parsed.success) return false;
    const target = trimmed.toLowerCase();
    return parsed.data.data.some(
      (row) => row.documentId !== excludeDocumentId && (row.name ?? '').trim().toLowerCase() === target
    );
  } catch {
    return false;
  }
}
