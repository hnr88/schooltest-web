'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  documentIdSchema,
  opsStudentStatusSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import { opsStudentProfilePath } from '@/modules/ops/queries/use-ops-student-profile.query';

/**
 * The first web consumers of C-OPS-STU-MOVE, C-OPS-STU-DEACT and
 * C-OPS-STU-REACT (task 18). None of the three declares a request/response
 * pair in the shared contract package yet, so the wire shape is parsed here
 * from the server's own actions (`schooltest-api/src/api/school/lib/
 * students-write.actions.ts`) rather than invented — a drifted body throws
 * instead of rendering a false success.
 *
 * None of the three needs the versioned-portal header: unlike the school
 * lifecycle writes, the ops student actions carry no `If-Match` / version
 * negotiation on the server today.
 */

export const moveStudentClassResultSchema = z.strictObject({
  documentId: documentIdSchema,
  class: z.strictObject({ documentId: documentIdSchema, name: z.string().nullable() }),
  moved: z.boolean(),
});
export type MoveStudentClassResult = z.infer<typeof moveStudentClassResultSchema>;

export const deactivateStudentResultSchema = z.strictObject({
  documentId: documentIdSchema,
  status: z.literal('archived'),
  seat_released: z.boolean(),
});
export type DeactivateStudentResult = z.infer<typeof deactivateStudentResultSchema>;

export const reactivateStudentResultSchema = z.strictObject({
  documentId: documentIdSchema,
  status: z.literal('active'),
  reactivated: z.boolean(),
});
export type ReactivateStudentResult = z.infer<typeof reactivateStudentResultSchema>;

/** The narrow read-back shape the action-kit's `readBack`/`isEligible` need — never the full profile. */
const studentReadBackSchema = z.object({
  status: opsStudentStatusSchema,
  class: z.object({ documentId: documentIdSchema }).nullable(),
});

async function fetchStudentReadBack(
  schoolDocumentId: string,
  studentDocumentId: string,
): Promise<{ status: string; classDocumentId: string | null }> {
  const res = await strapi.get<{ data: unknown }>(
    opsStudentProfilePath(schoolDocumentId, studentDocumentId),
    { opsPortalVersioned: true },
  );
  const parsed = studentReadBackSchema.parse(res.data.data);
  return { status: parsed.status, classDocumentId: parsed.class?.documentId ?? null };
}

function studentsListQueryPrefix(schoolDocumentId: string) {
  return ['ops', 'schools', schoolDocumentId, 'students'] as const;
}

export interface MoveStudentClassInput {
  schoolDocumentId: string;
  studentDocumentId: string;
  destinationClassDocumentId: string;
  /** Optimistic concurrency (C-OPS-PORTAL-013): the class the operator last saw this student in. */
  expectedClassDocumentId: string | null;
}

/** C-OPS-STU-MOVE — POST /ops/schools/{id}/students/{studentId}/move-class. */
export async function moveStudentClass(
  input: MoveStudentClassInput,
): Promise<MoveStudentClassResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/students/${input.studentDocumentId}/move-class`,
    {
      destination_class_documentId: input.destinationClassDocumentId,
      expected_class_documentId: input.expectedClassDocumentId,
    },
  );
  return moveStudentClassResultSchema.parse(res.data.data);
}

export interface StudentLifecycleInput {
  schoolDocumentId: string;
  studentDocumentId: string;
}

/** C-OPS-STU-DEACT — POST /ops/schools/{id}/students/{studentId}/deactivate. */
export async function deactivateStudent(
  input: StudentLifecycleInput,
): Promise<DeactivateStudentResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/students/${input.studentDocumentId}/deactivate`,
    {},
  );
  return deactivateStudentResultSchema.parse(res.data.data);
}

/** C-OPS-STU-REACT — POST /ops/schools/{id}/students/{studentId}/reactivate. */
export async function reactivateStudent(
  input: StudentLifecycleInput,
): Promise<ReactivateStudentResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/students/${input.studentDocumentId}/reactivate`,
    {},
  );
  return reactivateStudentResultSchema.parse(res.data.data);
}

function invalidateStudent(
  queryClient: ReturnType<typeof useQueryClient>,
  schoolDocumentId: string,
  studentDocumentId: string,
) {
  void queryClient.invalidateQueries({ queryKey: studentsListQueryPrefix(schoolDocumentId) });
  void queryClient.invalidateQueries({
    queryKey: [...studentsListQueryPrefix(schoolDocumentId), studentDocumentId, 'profile'],
  });
}

/** Direct, non-bulk mutation hooks — kept for callers outside the action-kit runner. */
export function useMoveStudentClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveStudentClass,
    onSuccess: (_result, variables) =>
      invalidateStudent(queryClient, variables.schoolDocumentId, variables.studentDocumentId),
  });
}

export function useDeactivateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateStudent,
    onSuccess: (_result, variables) =>
      invalidateStudent(queryClient, variables.schoolDocumentId, variables.studentDocumentId),
  });
}

export function useReactivateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateStudent,
    onSuccess: (_result, variables) =>
      invalidateStudent(queryClient, variables.schoolDocumentId, variables.studentDocumentId),
  });
}

/**
 * Row/bulk targets carry the class the operator last SAW this student in —
 * the optimistic-concurrency token the server re-checks inside its per-school
 * advisory lock (a stale picker 409s CLASS_MOVED with nothing written, rather
 * than silently overwriting a concurrent move).
 */
export interface MoveStudentClassTarget extends OpsActionTarget {
  expectedClassDocumentId: string | null;
}

/** The action-kit definition for Move class, over the runner (row menu AND bulk bar). */
export function moveStudentClassAction(
  schoolDocumentId: string,
  destinationClassDocumentId: string,
): OpsActionDefinition<MoveStudentClassTarget> {
  return {
    write: true,
    async perform(target) {
      await moveStudentClass({
        schoolDocumentId,
        studentDocumentId: target.documentId,
        destinationClassDocumentId,
        expectedClassDocumentId: target.expectedClassDocumentId,
      });
    },
    async readBack(target) {
      const current = await fetchStudentReadBack(schoolDocumentId, target.documentId);
      return current.classDocumentId === destinationClassDocumentId;
    },
  };
}

/** The action-kit definition for Deactivate, over the runner (row menu AND bulk bar). */
export function deactivateStudentAction(schoolDocumentId: string): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await deactivateStudent({ schoolDocumentId, studentDocumentId: target.documentId });
    },
    async readBack(target) {
      return (await fetchStudentReadBack(schoolDocumentId, target.documentId)).status === 'archived';
    },
    async isEligible(target) {
      return (await fetchStudentReadBack(schoolDocumentId, target.documentId)).status !== 'archived';
    },
  };
}

/** The action-kit definition for Reactivate, over the runner (row menu only — the design draws no bulk Reactivate). */
export function reactivateStudentAction(schoolDocumentId: string): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await reactivateStudent({ schoolDocumentId, studentDocumentId: target.documentId });
    },
    async readBack(target) {
      return (await fetchStudentReadBack(schoolDocumentId, target.documentId)).status === 'active';
    },
    async isEligible(target) {
      return (await fetchStudentReadBack(schoolDocumentId, target.documentId)).status !== 'active';
    },
  };
}
