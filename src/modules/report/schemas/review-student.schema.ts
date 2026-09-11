import { z } from 'zod';

// GET /api/students/:documentId, asked for `given_name`, `family_name` and the
// class populated to its name — the teacher-owned read that names the student
// and class behind a result (the result view carries neither). Only the
// fields the review header prints are kept.
export const reviewStudentSchema = z.object({
  data: z.object({
    documentId: z.string().min(1),
    given_name: z.string().nullable(),
    family_name: z.string().nullable(),
    class: z
      .object({ documentId: z.string().min(1), name: z.string().min(1) })
      .nullable()
      .optional(),
  }),
});
