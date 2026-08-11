import { z } from 'zod';

// REQUEST side of the teacher AI exports (C-TR-5/6/7). Deliberately a SEPARATE
// file from `teacher-export.schema.ts`: that module is the byte-for-byte mirror of
// `schooltest-api/src/contracts/teacher-export.ts` and
// `tests/e2e/teacher-contract-parity.spec.ts` asserts its export-name set exactly,
// so a portal-only shape must not be smuggled into it. Nothing here is a wire
// body — the three routes take no body at all; this validates the ARGUMENTS the
// browser hands the export Server Function.

const documentId = z.string().min(1);

/**
 * The three C-TR-5/6/7 routes as ONE discriminated request. Discriminated rather
 * than kind + optional id so a `student` export cannot be issued without a
 * student, and `strictObject` so a stray key is a parse failure rather than a
 * silently ignored field.
 */
export const teacherExportRequestSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('insights'), classDocumentId: documentId }),
  z.strictObject({ kind: z.literal('progress'), classDocumentId: documentId }),
  z.strictObject({
    kind: z.literal('student'),
    classDocumentId: documentId,
    studentDocumentId: documentId,
  }),
]);

/**
 * What crosses the Server Function boundary: the request plus the CALLER's own
 * Strapi JWT. The portal keeps that token in `localStorage` (never a cookie — see
 * `src/lib/axios/strapi.ts`), so the browser is the only holder and must pass it
 * for the export to be authorised as that teacher. The Server Function makes no
 * authorisation decision of its own: Strapi still applies `global::is-teacher` and
 * the `class.teacher = caller` object rule, and answers 403/404 exactly as
 * CONTRACTS.md pins.
 */
export const teacherExportInputSchema = z.strictObject({
  token: z.string().min(1),
  request: teacherExportRequestSchema,
});
