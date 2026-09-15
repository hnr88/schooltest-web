import { z } from 'zod';

import { bandSchema, resultStatusSchema } from '@schooltest/scoring-contracts';

/**
 * C-PAR-REPORT (NIGHT-2 W8, JF-039) — the client mirror of the API's
 * parent-family-report contract (schooltest-api/src/contracts/parent-family-report.ts).
 * The API enforces the family allow-list server-side; this mirror keeps the
 * boundary strict so a shape change fails LOUDLY here too.
 *
 * HELD and RECALLED payloads carry no measures at all — the "no score digits
 * anywhere" guarantee for the held face (PAR-012) is structural.
 */

const familyStudentSchema = z.object({
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
});

const familyAttributeSchema = z.object({
  status: bandSchema,
  domain_score: z.number().nullable(),
});

export const familyReportViewSchema = z.object({
  documentId: z.string().min(1),
  skill: z.string().nullable(),
  scope: z.enum(['skill', 'combined']),
  status: resultStatusSchema,
  display_label: z.string().nullable(),
  acara_phase: z.string().nullable(),
  published_at: z.string().nullable(),
  recalled_at: z.null(),
  release_state: z.literal('released'),
  overall_domain_score: z.number().nullable(),
  attributes: z.record(z.string(), familyAttributeSchema),
  narrative: z
    .object({ plain_language: z.array(z.string()).nullable() })
    .partial()
    .nullable(),
  student: familyStudentSchema,
});
export type FamilyReportView = z.infer<typeof familyReportViewSchema>;

export const familyReportHeldViewSchema = z.object({
  documentId: z.string().min(1),
  skill: z.string().nullable(),
  status: resultStatusSchema,
  display_label: z.string().nullable(),
  published_at: z.string().nullable(),
  recalled_at: z.string().nullable(),
  release_state: z.enum(['held', 'recalled']),
  student: familyStudentSchema,
});
export type FamilyReportHeldView = z.infer<typeof familyReportHeldViewSchema>;

export const familyReportDetailSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('released'), view: familyReportViewSchema }),
  z.object({ state: z.literal('held'), view: familyReportHeldViewSchema }),
  z.object({ state: z.literal('recalled'), view: familyReportHeldViewSchema }),
]);
export type FamilyReportDetail = z.infer<typeof familyReportDetailSchema>;

export const familyReportListRowSchema = z.object({
  documentId: z.string().min(1),
  state: z.enum(['held', 'released', 'recalled']),
  skill: z.string().nullable(),
  display_label: z.string().nullable(),
  acara_phase: z.string().nullable(),
  published_at: z.string().nullable(),
  recalled_at: z.string().nullable(),
  student: z.object({
    documentId: z.string(),
    given_name: z.string().nullable(),
    family_name: z.string().nullable(),
  }),
});
export type FamilyReportListRow = z.infer<typeof familyReportListRowSchema>;

/** BARE array (no envelope) — the C-11 `/api/my/*` convention. */
export const familyReportListSchema = z.array(familyReportListRowSchema);
