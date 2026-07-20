import { z } from 'zod';

// C-STUDENT-LIST base shape (CONTRACTS.md): the frozen 7-field row shared by the
// search endpoint. Parsed at the query boundary — a malformed/tampered response
// fails here instead of reaching the UI as bad data.
export const studentSchema = z.object({
  documentId: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  year_level: z.number().nullable(),
  email: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// C-STUDENT-LIST-EXT: GET /api/my/students rows now also carry the 5 nullable
// C-UI-MYCHILDREN table columns. The list schema extends the base with exactly
// these keys (nullable — Mia/Jonas predate the wizard and have null values); the
// search endpoint keeps returning the base 7 fields, so only the list row gains
// them.
export const studentListRowSchema = studentSchema.extend({
  nationality: z.string().nullable(),
  current_year_level: z.string().nullable(),
  target_entry_year: z.string().nullable(),
  target_entry_term: z.string().nullable(),
  status: z.string().nullable(),
});

const studentsPaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

// Mirrors lib/axios/strapi.ts's StrapiCollectionResponse<T> envelope shape.
export const studentsResponseSchema = z.object({
  data: z.array(studentListRowSchema),
  meta: z.object({ pagination: studentsPaginationSchema.optional() }),
});

export type Student = z.infer<typeof studentSchema>;
export type StudentListRow = z.infer<typeof studentListRowSchema>;
export type StudentsResponse = z.infer<typeof studentsResponseSchema>;

// C-STUDENT-SEARCH shape (CONTRACTS.md): GET /api/search/students?q= returns the
// base Student rows (no extended keys) with a `meta.query` envelope.
export const searchStudentsResponseSchema = z.object({
  data: z.array(studentSchema),
  meta: z.object({ query: z.object({ q: z.string(), count: z.number() }) }),
});

export type SearchStudentsResponse = z.infer<typeof searchStudentsResponseSchema>;
