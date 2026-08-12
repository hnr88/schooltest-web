import { z } from 'zod';

// TEACHER AI EXPORTS — client mirror of the C-TR-5/6/7 TRANSPORT
// (.qa/CONTRACTS.md; schooltest-api/src/contracts/teacher-export.ts). These
// three routes do not answer JSON: the body IS the Markdown document, served as
// an attachment, so what the client must pin is the content type, the
// disposition and the trailing `## Prompt` section.
//
// De-identification is SERVER-SIDE and total (`S01`, `S02`, … assigned by roster
// order). The anonymised-id formatter is therefore deliberately NOT mirrored
// here — nothing in the portal mints or rewrites an id, and a client-side copy
// could only ever disagree with the server that already did the work.

/** Which of the three documents a request is for. */
export const teacherExportKindSchema = z.enum(['insights', 'progress', 'student']);

/** Byte-exact `Content-Type` every export responds with. */
export const TEACHER_EXPORT_CONTENT_TYPE = 'text/markdown; charset=utf-8' as const;

/** The heading that closes every document — the ready-to-paste LLM prompt. */
export const TEACHER_EXPORT_PROMPT_HEADING = '## Prompt' as const;

/**
 * `Content-Disposition` shape, with the filename captured so exactly one
 * expression both validates the header and names the downloaded file.
 */
export const TEACHER_EXPORT_DISPOSITION_PATTERN = /^attachment; filename="([^"]+\.md)"$/;

/**
 * A document that does not carry a trailing `## Prompt` section is a defect, not
 * a variant — the whole point of the export is that a teacher can paste it
 * straight into Claude/Gemini/ChatGPT.
 */
export const teacherExportDocumentSchema = z
  .string()
  .min(1)
  .refine((body) => body.trimEnd().includes(`\n${TEACHER_EXPORT_PROMPT_HEADING}`), {
    message: `export must carry a trailing "${TEACHER_EXPORT_PROMPT_HEADING}" section`,
  });

/**
 * NOT strict: this parses a real response-header bag, which carries many other
 * keys. The two pinned entries are the whole transport contract.
 */
export const teacherExportHeadersSchema = z.object({
  'content-type': z.literal(TEACHER_EXPORT_CONTENT_TYPE),
  'content-disposition': z
    .string()
    .regex(TEACHER_EXPORT_DISPOSITION_PATTERN, 'must be an .md attachment'),
});
