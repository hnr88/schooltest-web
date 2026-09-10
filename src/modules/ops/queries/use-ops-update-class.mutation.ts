'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { classCreateResponseSchema } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { opsClassDetailQueryKey } from '@/modules/ops/queries/use-ops-class-detail.query';
import { classRowEnvelopeSchema } from '@/modules/ops/lib/ops-classes-contract';

/** Thrown on 412: the class moved under the form — the DRAFT is intact; refresh and reapply. */
export class OpsClassEditStaleError extends Error {
  readonly currentUpdatedAt: string | null;

  constructor(currentUpdatedAt: string | null) {
    super('this class changed after the edit began — refresh and reapply the draft');
    this.name = 'OpsClassEditStaleError';
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export interface OpsUpdateClassInput {
  classDocumentId: string;
  schoolDocumentId: string;
  /** The class `updatedAt` the form was opened with — sent as If-Match. */
  classUpdatedAt: string | null;
  name: string;
  /**
   * The key is ALWAYS sent: a string sets the band, an explicit null CLEARS it.
   * Omission would mean "leave untouched", which is a different thing here.
   */
  yearBand: string | null;
}

async function updateOpsClass(input: OpsUpdateClassInput): Promise<unknown> {
  try {
    // Task 19 tightened edit: name + year_band ONLY, on the class-anchored ops
    // route. The teacher relation is deliberately ABSENT — assignment is the
    // assign-teacher route (task 20), so saving name/year can never overwrite
    // a teacher changed elsewhere. If-Match turns a stale form into a 412
    // instead of a silent clobber.
    const res = await strapi.patch(
      `/api/ops/schools/${input.schoolDocumentId}/classes/${input.classDocumentId}`,
      { data: { name: input.name, year_band: input.yearBand } },
      { headers: input.classUpdatedAt ? { 'If-Match': input.classUpdatedAt } : {} },
    );
    return res.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 412) {
      const details = (
        error.response.data as {
          error?: { details?: { currentUpdatedAt?: string | null } };
        }
      )?.error?.details;
      throw new OpsClassEditStaleError(details?.currentUpdatedAt ?? null);
    }
    throw error;
  }
}

export function useOpsUpdateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpsClass,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: opsClassDetailQueryKey(input.classDocumentId),
      });
      // Task 23 — a name/year_band edit also changes what the Classes tab's
      // list renders (the name column, the year filter); the archive/restore
      // and assign-teacher mutations below already invalidate this same key.
      void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', input.schoolDocumentId] });
    },
  });
}

/**
 * Task 23 — C-OPS-CLASS-CREATE. `POST /ops/schools/:schoolDocumentId/classes`.
 *
 * The request is name + year_band ONLY (verified against `127.0.0.1:5500`,
 * `proof/23.md`): the route rejects any relation key with a named 400
 * ("this ops write accepts name and year_band only; teacher assignment is
 * the assign-teacher route (task 20)"). A picked teacher or test window is
 * therefore never sent here — the class-form dialog chains `assignTeacher`
 * and `assignClassWindow` below onto a successful create, exactly as it
 * already must for an EDIT (task 19 tightened that route the same way).
 *
 * The response is a PARTIAL row — `classCreateResponseSchema`, not the full
 * `classRowEnvelopeSchema` the archive/restore routes return (see the
 * contract source's doc comment). Only `documentId` is needed to chain the
 * follow-up writes; the rest is parsed for the caller's own convenience.
 */
export interface OpsCreateClassInput {
  schoolDocumentId: string;
  name: string;
  /** `null` clears/omits the band; the key is always sent, matching the edit mutation's discipline. */
  yearBand: string | null;
}

async function createOpsClass(input: OpsCreateClassInput) {
  const res = await strapi.post(`/api/ops/schools/${input.schoolDocumentId}/classes`, {
    name: input.name,
    year_band: input.yearBand,
  });
  return classCreateResponseSchema.parse(res.data).data;
}

export function useOpsCreateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOpsClass,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', input.schoolDocumentId] });
    },
  });
}

export interface OpsClassLifecycleInput {
  classDocumentId: string;
  schoolDocumentId: string;
}

async function changeOpsClassLifecycle(
  input: OpsClassLifecycleInput,
  action: 'archive' | 'restore',
) {
  const res = await strapi.post(
    `/api/ops/schools/${input.schoolDocumentId}/classes/${input.classDocumentId}/${action}`,
    {},
  );
  return classRowEnvelopeSchema.parse(res.data).data;
}

export function useOpsArchiveClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpsClassLifecycleInput) => changeOpsClassLifecycle(input, 'archive'),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', input.schoolDocumentId] });
      await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(input.classDocumentId) });
    },
  });
}

export function useOpsRestoreClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpsClassLifecycleInput) => changeOpsClassLifecycle(input, 'restore'),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', input.schoolDocumentId] });
      await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(input.classDocumentId) });
    },
  });
}

export interface OpsAssignTeacherInput {
  classDocumentId: string;
  schoolDocumentId: string;
}

/**
 * Task 22 — thrown when the server refuses the PICKED teacher (403: not a
 * teacher of this school, blocked, or not yet confirmed — the exact
 * `assertAssignableTeachers` boundary the assign route enforces). The picker
 * was fetched a moment earlier and is now stale; the caller refetches the
 * teacher list and reports it rather than retrying the same request blind.
 * Named after the 412 pattern `OpsClassEditStaleError` already sets in this
 * file. (The contract record's Errors list also names 422 for this case; the
 * live route answers 403 for every eligibility refusal it throws — verified
 * against `127.0.0.1:5500`, see proof/22.md — so both are caught here.)
 */
export class OpsAssignTeacherIneligibleError extends Error {
  constructor() {
    super('this teacher is no longer eligible for this class — refresh and re-pick');
    this.name = 'OpsAssignTeacherIneligibleError';
  }
}

/**
 * Task 20 — the class-assignment write (POST /ops/classes/:documentId/
 * assign-teacher). The SUBMITTED list is the whole assignment: one documentId
 * to assign, an empty array to UNASSIGN deliberately. The server answers
 * meta.changed=false when the same teacher was re-selected — surfaced to the
 * caller so the UI never celebrates a no-op.
 *
 * Task 23 — extracted to a plain function so the class-form dialog can chain
 * it onto a freshly-created class's documentId (not known until the create
 * response returns, so it cannot be a hook argument the way the class page's
 * `useOpsAssignTeacherMutation` needs it). The hook below is now a thin
 * wrapper kept for the class page's own direct usage — unchanged behaviour.
 */
async function assignTeacher(
  classDocumentId: string,
  teacherDocumentIds: string[],
): Promise<{ changed: boolean }> {
  try {
    const res = await strapi.post(`/api/ops/classes/${classDocumentId}/assign-teacher`, {
      teacher_documentIds: teacherDocumentIds,
    });
    const changed = (res.data as { meta?: { changed?: boolean } })?.meta?.changed !== false;
    return { changed };
  } catch (error) {
    if (isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 422)) {
      throw new OpsAssignTeacherIneligibleError();
    }
    throw error;
  }
}

/** Task 23 — the plain write, for the class-form dialog's create/edit chain (see `assignTeacher` above). */
export { assignTeacher };

export function useOpsAssignTeacherMutation(classDocumentId: string, schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherDocumentIds: string[]) => assignTeacher(classDocumentId, teacherDocumentIds),
    onSuccess: async () => {
      // A changed assignment moves class + roster + BOTH teachers' counts.
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
      await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(classDocumentId) });
    },
  });
}

/**
 * Task 20 — the per-class named test window (PUT /ops/schools/:schoolDocumentId/
 * classes/:classDocumentId/window). `windowDocumentId: null` means "No window
 * yet"; a non-null choice requires an eligible teacher, which the API enforces.
 *
 * Task 23 — extracted to a plain function for the same reason as
 * `assignTeacher` above: the class-form dialog needs to chain this onto a
 * class documentId that may not exist until a create call just returned it.
 */
async function assignClassWindow(
  schoolDocumentId: string,
  classDocumentId: string,
  windowDocumentId: string | null,
): Promise<unknown> {
  const res = await strapi.put(`/api/ops/schools/${schoolDocumentId}/classes/${classDocumentId}/window`, {
    window_documentId: windowDocumentId,
  });
  return res.data;
}

export { assignClassWindow };

export function useOpsAssignClassWindowMutation(
  classDocumentId: string,
  schoolDocumentId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (windowDocumentId: string | null) =>
      assignClassWindow(schoolDocumentId, classDocumentId, windowDocumentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
      await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(classDocumentId) });
    },
  });
}
