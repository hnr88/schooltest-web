'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { documentIdSchema, opsStudentStatusSchema } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * C-OPS-STU-EDIT — PATCH /api/ops/schools/{schoolDocumentId}/students/
 * {studentDocumentId}, and the response shape its POST (create) sibling
 * shares. The shared contract package does not declare this pair yet, so the
 * wire is parsed here from the frozen task contract rather than invented — a
 * drifted body throws instead of rendering a false success (the same rule the
 * sibling `use-student-actions.mutation.ts` writes follow).
 *
 * The body is STRICT and every key is OPTIONAL: the server 400s an empty body
 * and an unknown key, so the caller sends ONLY the fields the operator actually
 * changed (`null` = clear the field, `class_documentId: null` = unassign).
 * `status` is deliberately absent — lifecycle runs through the existing
 * deactivate/reactivate endpoints.
 */
export const opsStudentWriteBodySchema = z.strictObject({
  given_name: z.string().optional(),
  family_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  year_level: z.number().int().min(7).max(12).nullable().optional(),
  first_language: z.string().nullable().optional(),
  acara_phase: z.string().nullable().optional(),
  other_languages: z.array(z.string()).nullable().optional(),
  l1_literate: z.boolean().nullable().optional(),
  prior_schooling_interrupted: z.boolean().nullable().optional(),
  time_learning_english_yrs: z.number().nullable().optional(),
  time_in_australia_months: z.number().int().nullable().optional(),
  class_documentId: z.string().nullable().optional(),
});

export type OpsStudentWriteBody = z.output<typeof opsStudentWriteBodySchema>;

export const opsStudentWriteResultSchema = z.strictObject({
  documentId: documentIdSchema,
  given_name: z.string(),
  family_name: z.string().nullable(),
  email: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  year_level: z.number().int().nullable(),
  first_language: z.string().nullable(),
  acara_phase: z.string().nullable(),
  // The repo-wide `status` -> `student_status` rename (Strapi v5 reserved-word
  // collision) applies to this projection too — the server's
  // projectOpsStudentDetail emits `student_status`, and this strict parse
  // mirrors the vendor opsStudentDetailSchema it was pinned against.
  student_status: opsStudentStatusSchema,
  class: z
    .strictObject({ documentId: documentIdSchema, name: z.string().nullable() })
    .nullable(),
  school: z.strictObject({ documentId: documentIdSchema }).nullable(),
});
export type OpsStudentWriteResult = z.infer<typeof opsStudentWriteResultSchema>;

export interface OpsStudentUpdateInput {
  schoolDocumentId: string;
  studentDocumentId: string;
  /** Only the changed fields — never `{}` (the server rejects an empty body). */
  body: OpsStudentWriteBody;
}

export const opsStudentWritePath = (schoolDocumentId: string, studentDocumentId: string) =>
  `/api/ops/schools/${schoolDocumentId}/students/${studentDocumentId}`;

/** C-OPS-STU-EDIT — the PATCH half. No versioned-portal header, matching every other ops student write. */
export async function updateOpsStudent(
  input: OpsStudentUpdateInput,
): Promise<OpsStudentWriteResult> {
  const body = opsStudentWriteBodySchema.parse(input.body);
  const res = await strapi.patch<{ data: unknown }>(
    opsStudentWritePath(input.schoolDocumentId, input.studentDocumentId),
    body,
  );
  return opsStudentWriteResultSchema.parse(res.data.data);
}

/**
 * One prefix invalidation for every student write: the students list keys,
 * the profile read (`['ops','schools',school,'students',student,'profile']`)
 * and the class/roster reads all nest under or beside the same
 * `['ops','schools',schoolDocumentId]` root, exactly like the sibling
 * `invalidateStudent` in use-student-actions.mutation.ts.
 */
export function invalidateOpsStudentData(
  queryClient: ReturnType<typeof useQueryClient>,
  schoolDocumentId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId, 'students'] });
  void queryClient.invalidateQueries({
    queryKey: ['ops', 'schools', schoolDocumentId, 'classes'],
  });
  void queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
}

export function useOpsStudentUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpsStudent,
    onSuccess: (_result, variables) =>
      invalidateOpsStudentData(queryClient, variables.schoolDocumentId),
  });
}
