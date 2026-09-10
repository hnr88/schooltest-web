import { z } from 'zod';

// C-WIN-01 (task 68, st-mvp-pivot): the core forms picker source.
//
// ops/43 (R-19): the school-level form-window record (`formWindowSchema`,
// `FormWindow`, `createFormWindowFormSchema`) retired with `OpsFormWindow` —
// no form picker, form code or open/close pair is drawn on the school detail
// (`Ops Portal.dc.html:203-320`). `opsFormSchema`/`OpsForm` stay: they are the
// core GET /api/forms picker source, and `OpsClassesTab.tsx`'s class-level
// Test window still reads it through `use-forms.query.ts`.

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
