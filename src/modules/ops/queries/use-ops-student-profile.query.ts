'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  OPS_STUDENT_STATUSES,
  OPS_ACARA_PHASES,
  documentIdSchema,
  opsStudentLatestResultSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * C-OPS-PORTAL-036 — the ops student profile read. The wire shape is parsed,
 * never cast: a drifted body throws here instead of rendering invented cells.
 * Deliberately NO `placeholderData`: when the operator switches rows, the new
 * key starts pending — a late response for the PREVIOUS student can never
 * overwrite the newer displayed profile.
 */
export const opsStudentProfileQueryKey = (
  schoolDocumentId: string,
  studentDocumentId: string,
) => ['ops', 'schools', schoolDocumentId, 'students', studentDocumentId, 'profile'] as const;

export const opsStudentProfilePath = (schoolDocumentId: string, studentDocumentId: string) =>
  `/api/ops/schools/${schoolDocumentId}/students/${studentDocumentId}/profile`;

export const opsStudentProfileSchema = z.strictObject({
  documentId: documentIdSchema,
  given_name: z.string(),
  family_name: z.string().nullable(),
  year_level: z.number().int().nullable(),
  first_language: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  acara_phase: z.enum(OPS_ACARA_PHASES).nullable(),
  student_status: z.enum(OPS_STUDENT_STATUSES),
  // The six C-OPS-STU-EDIT contact/EAL/D fields the profile projection gains
  // (the same keys the PATCH/POST bodies carry). `nullish`, not bare
  // `.nullable()`: until the server deploys the edit contract these keys are
  // ABSENT, and a bare nullable field would reject every profile in the
  // transition window — the exact failure mode the updatedAt note below
  // records. Absent reads as "not set" (null), identical to the school
  // students' roster precedent.
  email: z.string().nullish().transform((value) => value ?? null),
  other_languages: z.array(z.string()).nullish().transform((value) => value ?? null),
  l1_literate: z.boolean().nullish().transform((value) => value ?? null),
  prior_schooling_interrupted: z.boolean().nullish().transform((value) => value ?? null),
  time_learning_english_yrs: z.number().nullish().transform((value) => value ?? null),
  time_in_australia_months: z.number().int().nullish().transform((value) => value ?? null),
  // NO updatedAt: the server's profile projection never carries it, so this
  // strict schema demanding an absent key rejected EVERY real profile and the
  // panel rendered its error state for every student (NIGHT-2 W2 find).
  // The server's class sub-object carries its numeric `id` alongside the
  // documentId — strictObject must mirror the wire or every enrolled student
  // rejects (NIGHT-2 W2 find: "Unrecognized key: id" killed the panel).
  class: z
    .strictObject({ id: z.number(), documentId: documentIdSchema, name: z.string().nullable() })
    .nullable(),
  latest_result: opsStudentLatestResultSchema.nullable(),
  attempts: z
    .array(
      z.strictObject({
        documentId: documentIdSchema,
        skill: z.string().nullable(),
        status: z.string(),
        started_at: z.string().nullable(),
        ended_at: z.string().nullable(),
        invalidated_at: z.string().nullable(),
        official: z.boolean(),
      }),
    )
    .max(10),
});

export type OpsStudentProfile = z.infer<typeof opsStudentProfileSchema>;

async function fetchOpsStudentProfile(
  schoolDocumentId: string,
  studentDocumentId: string,
): Promise<OpsStudentProfile> {
  const res = await strapi.get<{ data: unknown }>(
    opsStudentProfilePath(schoolDocumentId, studentDocumentId),
    { opsPortalVersioned: true },
  );
  return opsStudentProfileSchema.parse(res.data.data);
}

export function useOpsStudentProfileQuery(
  schoolDocumentId: string,
  studentDocumentId: string | null,
) {
  return useQuery({
    queryKey: opsStudentProfileQueryKey(schoolDocumentId, studentDocumentId ?? 'none'),
    queryFn: () => {
      if (studentDocumentId === null) {
        throw new Error('[student-profile] query ran without a student documentId');
      }
      return fetchOpsStudentProfile(schoolDocumentId, studentDocumentId);
    },
    enabled: studentDocumentId !== null,
    retry: false,
    staleTime: 30 * 1000,
  });
}
