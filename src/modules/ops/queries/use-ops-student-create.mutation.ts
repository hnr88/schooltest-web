'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { strapi } from '@/lib/axios/strapi';
import {
  invalidateOpsStudentData,
  opsStudentWriteBodySchema,
  opsStudentWriteResultSchema,
  type OpsStudentWriteBody,
  type OpsStudentWriteResult,
} from '@/modules/ops/queries/use-ops-student-update.mutation';

/**
 * C-OPS-STU-CREATE — POST /api/ops/schools/{schoolDocumentId}/students, the
 * create sibling of the PATCH in use-ops-student-update.mutation.ts (same
 * body keys, same response shape — the body schema below only tightens
 * `given_name` from optional to required, per the frozen contract).
 *
 * The 403 refusals carry named codes the caller must surface verbatim:
 * SEAT_CAP ("Contact SchoolTest to add seats") and SCHOOL_INACTIVE — the
 * modal maps them through `classifyStudentError` to dedicated toasts, the
 * same way the school-students form does.
 *
 * No versioned-portal header, matching every other ops student write.
 */
export const opsStudentCreateBodySchema = z.strictObject({
  ...opsStudentWriteBodySchema.shape,
  given_name: z.string().min(1),
});

export interface OpsStudentCreateInput {
  schoolDocumentId: string;
  /** `given_name` is REQUIRED here (the PATCH twin keeps it optional). */
  body: OpsStudentWriteBody & { given_name: string };
}

/** C-OPS-STU-CREATE — POST /api/ops/schools/{schoolDocumentId}/students (201). */
export async function createOpsStudent(
  input: OpsStudentCreateInput,
): Promise<OpsStudentWriteResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/students`,
    input.body,
  );
  return opsStudentWriteResultSchema.parse(res.data.data);
}

export function useOpsStudentCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOpsStudent,
    onSuccess: (_result, variables) => invalidateOpsStudentData(queryClient, variables.schoolDocumentId),
  });
}
