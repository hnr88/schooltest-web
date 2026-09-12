import { z } from 'zod';

/**
 * C-TT-DEMO `POST /api/teacher/demo-link` — the web mirror of the demo half of
 * `schooltest-api/src/contracts/teacher-trial.ts` (chunk B4). The Start-a-session
 * modal's "Teacher demo" mode: the body names only the FORM the teacher picked,
 * because the server reads the skill off the form row, so the link can never
 * claim a skill the form does not teach.
 *
 * `url` is the desktop deep link the emailed trial flow already carries
 * (`schooltest://auth/teacher/verify?token=…`); `web_url` is the same single-use
 * token on the web verify path, which is the one a browser can open. `expires_at`
 * is the token row's own expiry, so the dialog states how long the link lives
 * instead of repeating the design's "expires when you close the demo" (untrue).
 */
const documentId = z.string().min(1);

export const createDemoLinkBodySchema = z.strictObject({
  form_document_id: documentId,
});

export const createDemoLinkResponseSchema = z.strictObject({
  url: z.string().min(1),
  web_url: z.string().min(1),
  expires_at: z.string().min(1),
  form_document_id: documentId,
  skill: z.string().min(1),
  variant: z.string().nullable(),
});
