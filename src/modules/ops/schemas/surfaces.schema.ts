import { z } from 'zod';

// C-OPS-04 (task 70, st-mvp-pivot): the ops data-surface boundary schemas —
// form Q-matrix + key inspection and the audited view-as-teacher payload.

// Inspection row: the API maps the item schema's `correct_key` to the
// contract's `key`; `attribute_vector` and `key` stay opaque JSON here.
export const inspectionItemSchema = z.object({
  item_code: z.string(),
  task_type: z.string().nullable(),
  stage: z.number().nullable(),
  attribute_vector: z.unknown(),
  key: z.unknown(),
});

export type InspectionItem = z.infer<typeof inspectionItemSchema>;

export const formInspectionSchema = z.object({
  form_code: z.string(),
  items: z.array(inspectionItemSchema),
  anchors: z.array(z.string()),
  locked: z.boolean(),
});

export type FormInspection = z.infer<typeof formInspectionSchema>;

// The school's staff users from the C-OPS-01 detail relations (core
// GET /api/schools/:documentId with the users relation populated). The role
// relation is restricted over REST, so the picker lists staff accounts and
// the API enforces teacher-only with a 404.
export const schoolStaffUserSchema = z.object({
  documentId: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
});

export type SchoolStaffUser = z.infer<typeof schoolStaffUserSchema>;

// View-as-teacher: the exact teacher-scoped payload set (C-CLS-01 classes,
// the teacher's sitting list rows, one C-SIT-02 monitor per sitting).
export const viewAsTeacherSchema = z.object({
  teacher: z.object({
    documentId: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  classes: z.array(
    z.object({
      documentId: z.string(),
      name: z.string().nullable(),
      year_band: z.string().nullable(),
      teachers: z.array(
        z.object({
          documentId: z.string(),
          first_name: z.string().nullable(),
          last_name: z.string().nullable(),
        }),
      ),
      student_count: z.number(),
    }),
  ),
  sittings: z.array(
    z.object({
      documentId: z.string(),
      code: z.string().nullable(),
      status: z.string(),
      mode: z.string().nullable(),
      skill: z.string().nullable(),
      opened_at: z.string().nullable(),
      closed_at: z.string().nullable(),
      class: z
        .object({ documentId: z.string(), name: z.string().nullable() })
        .nullable(),
      form: z
        .object({ documentId: z.string(), form_code: z.string().nullable() })
        .nullable(),
    }),
  ),
  monitors: z.array(
    z.object({
      sitting: z.object({
        documentId: z.string(),
        code: z.string().nullable(),
        status: z.string(),
      }),
      students: z.array(
        z.object({
          documentId: z.string(),
          given_name: z.string().nullable(),
          family_name: z.string().nullable(),
          email: z.string().nullable(),
          state: z.enum(['not_joined', 'joined', 'in_progress', 'submitted', 'stalled']),
          session_documentId: z.string().nullable(),
        }),
      ),
    }),
  ),
});

export type ViewAsTeacher = z.infer<typeof viewAsTeacherSchema>;
