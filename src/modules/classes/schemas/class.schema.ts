import { z } from 'zod';

// Server response schemas for the school class endpoints (C-CLS-01..03).
// Kept defensive at the boundary; the UI consumes the parsed types from
// types/classes.types.ts.

export const classTeacherSchema = z.object({
  documentId: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
});

// BUG-006: the INVITED (not yet activated) teacher a class is waiting on. The
// state is the server's, derived from the invitation: anything but `pending`
// means the invitation lapsed and the class needs its teacher reassigned.
export const classPendingTeacherSchema = z.object({
  documentId: z.string(),
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  state: z.enum(['pending', 'expired', 'revoked', 'accepted']),
});

export const schoolClassSchema = z.object({
  documentId: z.string(),
  name: z.string(),
  year_band: z.string().nullable(),
  teachers: z.array(classTeacherSchema),
  // Absent from rows the server did not load it for; absent reads as none.
  pending_teacher: classPendingTeacherSchema.nullable().default(null),
  student_count: z.number(),
});

// Spec §2 "Add class modal": name required, teacher optional (assignable
// later). The CSV rows are NOT form values — StudentImportFields parses them
// and reports them through its own onChange, so the host owns that state.
export function createAddClassFormSchema(tv: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, tv('required')).max(120, tv('tooLong')),
    teacher_documentId: z.string(),
  });
}

export type AddClassFormValues = z.infer<ReturnType<typeof createAddClassFormSchema>>;
