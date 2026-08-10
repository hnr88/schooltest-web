import { z } from 'zod';

// THE SETUP FORM'S OWN VALIDATION — "has the teacher chosen yet?", a UI
// question the wire contract does not answer. C-TS-1's
// `createTestSessionBodySchema` (teacher-session.schema.ts) stays the single
// authority for what is POSTed: it describes a body that ALREADY carries two
// document ids and is parsed inside `use-create-test-session.mutation.ts`.
// This schema is not a second copy of it and never travels.
//
// The messages are i18n KEYS under `Teacher.testSessions.setup`, resolved by
// the component through `t()` — the same convention the auth schemas use, so
// no English literal is baked into a validation rule.
export const startTestSessionFormSchema = z.object({
  class_document_id: z.string().min(1, 'classRequired'),
  form_document_id: z.string().min(1, 'testRequired'),
});
