import { z } from 'zod';

// C-WIN-01 (task 68, st-mvp-pivot): the ops per-school form window — which
// prebuilt form is live for the school's sittings, and when.

// Core GET /api/forms row (the picker source — a core route, no new endpoint).
export const opsFormSchema = z.object({
  documentId: z.string(),
  form_code: z.string(),
  skill: z.string().nullable(),
  mode: z.string().nullable(),
  year_band: z.string().nullable(),
  active: z.boolean().nullable(),
});

export type OpsForm = z.infer<typeof opsFormSchema>;

// Core GET /api/form-windows row with the form populated (the C-WIN-01 PUT
// response carries the same projection).
export const formWindowSchema = z.object({
  documentId: z.string(),
  opens_at: z.string(),
  closes_at: z.string(),
  form: z.object({ documentId: z.string(), form_code: z.string() }).nullable(),
});

export type FormWindow = z.infer<typeof formWindowSchema>;

// Ops window form: datetime-local strings in the UI, ISO datetimes on the wire.
export function createFormWindowFormSchema(tv: (key: string) => string) {
  return z
    .object({
      form_documentId: z.string().min(1, tv('formRequired')),
      opens_at: z.string().min(1, tv('datetimeRequired')),
      closes_at: z.string().min(1, tv('datetimeRequired')),
    })
    .refine((values) => Date.parse(values.opens_at) < Date.parse(values.closes_at), {
      message: tv('order'),
      path: ['closes_at'],
    });
}

export type FormWindowFormValues = z.infer<ReturnType<typeof createFormWindowFormSchema>>;
