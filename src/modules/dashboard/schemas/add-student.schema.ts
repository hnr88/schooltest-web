import { z } from 'zod';

import { studentSchema } from '@/modules/dashboard/schemas/student.schema';

// C-STUDENT-CREATE (CONTRACTS.md): year_level int 7..12. The dialog renders a
// Select of exactly these options, so an out-of-range value can only reach
// this schema via a tampered request — the min/max checks still guard it.
export const YEAR_LEVEL_OPTIONS = [7, 8, 9, 10, 11, 12] as const;

// Form schema: year_level starts unselected (null) until the parent picks a
// Select option — the type-predicate refine narrows the parsed OUTPUT to a
// plain `number`, while the raw form field stays `number | null` (see
// AddStudentFormValues below), matching the Select's placeholder state.
export const addStudentSchema = z.object({
  given_name: z.string().trim().min(1, 'nameRequired'),
  family_name: z.string().trim().min(1, 'nameRequired'),
  year_level: z
    .number()
    .int()
    .min(7, 'yearLevelRequired')
    .max(12, 'yearLevelRequired')
    .nullable()
    .refine((value): value is number => value !== null, { message: 'yearLevelRequired' }),
  email: z.union([z.literal(''), z.string().trim().pipe(z.email('emailInvalid'))]),
});

// Raw RHF field values (pre-validation) — year_level may still be null here.
export type AddStudentFormValues = z.input<typeof addStudentSchema>;
// Validated submit payload (post-resolver) — year_level is guaranteed a number.
export type AddStudentInput = z.infer<typeof addStudentSchema>;

// C-STUDENT-CREATE 200 envelope: { data: Student }. Reuses the same Student
// shape task 16 already validates GET /api/my/students against — unknown
// extra keys the api returns (student_key, parent, accommodations, …) are
// stripped by the parse, never reaching the UI.
export const createStudentResponseSchema = z.object({
  data: studentSchema,
  meta: z.record(z.string(), z.unknown()),
});

export type CreateStudentResponse = z.infer<typeof createStudentResponseSchema>;
