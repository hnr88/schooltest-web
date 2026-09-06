import { z } from 'zod';

// Boundary schema for the ops class-detail read. Unlike the field-for-field
// STRICT mirrors elsewhere, this parses a populate-ed raw entity, so the
// Strapi-managed keys (id / createdAt / publishedAt / ...) are deliberately
// allowed through: they are never rendered, only the fields below are. The
// nested student row is also loose for the same reason — only the columns the
// ops roster renders are picked out, and a field that is genuinely absent
// (e.g. first_language / acara_phase) stays null rather than being invented.

const nullable = <T extends z.ZodType>(schema: T) => schema.nullable();

export const opsClassDetailStudentSchema = z.object({
  documentId: z.string(),
  given_name: nullable(z.string()),
  family_name: nullable(z.string()),
  year_level: nullable(z.number()),
  first_language: nullable(z.string()),
  acara_phase: nullable(z.string()),
  status: nullable(z.string()),
});

export const opsClassDetailSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().min(1),
  year_band: nullable(z.string()),
  // The edit form's If-Match token (task 19): whatever the form opened with.
  updatedAt: nullable(z.string()),
  school: z
    .object({ documentId: z.string().min(1), name: z.string().min(1) })
    .nullable(),
  teacher: z
    .object({
      documentId: z.string().min(1),
      first_name: nullable(z.string()),
      last_name: nullable(z.string()),
      email: z.string().min(1),
    })
    .nullable(),
  students: z.array(opsClassDetailStudentSchema),
});

export type OpsClassDetail = z.infer<typeof opsClassDetailSchema>;
export type OpsClassDetailStudent = z.infer<typeof opsClassDetailStudentSchema>;
