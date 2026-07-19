import { z } from 'zod';

// C-STUDENT-LIST shape (CONTRACTS.md): parent-scoped student rows returned by
// GET /api/my/students. Parsed at the query boundary — a malformed/tampered
// response fails here instead of reaching the UI as bad data.
export const studentSchema = z.object({
  documentId: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  year_level: z.number().nullable(),
  email: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const studentsPaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

// Mirrors lib/axios/strapi.ts's StrapiCollectionResponse<T> envelope shape.
export const studentsResponseSchema = z.object({
  data: z.array(studentSchema),
  meta: z.object({ pagination: studentsPaginationSchema.optional() }),
});

export type Student = z.infer<typeof studentSchema>;
export type StudentsResponse = z.infer<typeof studentsResponseSchema>;

// C-STUDENT-SEARCH shape (CONTRACTS.md): GET /api/search/students?q= returns
// the same Student rows with a `meta.query` envelope instead of pagination.
export const searchStudentsResponseSchema = z.object({
  data: z.array(studentSchema),
  meta: z.object({ query: z.object({ q: z.string(), count: z.number() }) }),
});

export type SearchStudentsResponse = z.infer<typeof searchStudentsResponseSchema>;
