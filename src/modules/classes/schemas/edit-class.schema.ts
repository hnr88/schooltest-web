import { z } from 'zod';

// Spec §1 "Edit Class Modal": class name (required) and a SINGLE assigned
// teacher (optional — the empty string is the "unassigned" option, which the
// hook sends to C-CLS-03 as an empty teacher list). No year band and no student
// list: the modal edits exactly these two fields.
export function createEditClassFormSchema(tv: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, tv('required')).max(120, tv('tooLong')),
    teacher_documentId: z.string(),
  });
}

export type EditClassFormValues = z.infer<ReturnType<typeof createEditClassFormSchema>>;
