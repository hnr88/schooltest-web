/**
 * OPS-056 — C-OPS-PORTAL-046 `GET /api/ops/schools/{documentId}/import-students/template.csv`.
 *
 * ONE column vocabulary for the downloaded template, the upload help text and
 * the parser. Before this module the web app hand-declared the six legacy
 * headers next to its download button and the server hand-declared them again
 * in `import.constants.ts`; the two could drift silently and the pictured
 * portal columns existed nowhere at all.
 *
 * Two vocabularies live here on purpose (D-COMPAT):
 *  - LEGACY (no `X-Ops-Portal-Version` header) is the email-keyed template
 *    with a `class` column: first name, last name, email, date of birth, year
 *    level, first language, class, proficiency level (optional). A caller that
 *    omits the header downloads exactly the file its parser accepts.
 *  - PORTAL (`X-Ops-Portal-Version: 1`) is the pictured template
 *    (mvp/ops/Ops Portal.dc.html:802) plus a REQUIRED `email` column: given
 *    name, family name, email, date of birth, year level, home language. The
 *    class comes from the modal's "Add to class" picker, never from a CSV
 *    column, and the email is required so every committed row provisions the
 *    student's account from a real, deliverable address instead of the
 *    `<student_key>@students.schooltest.invalid` fallback.
 *
 * Pure data + pure functions: no Strapi, no DOM, no node builtins, because both
 * applications import this file.
 */
import { z } from 'zod';

import type { PortalMode } from './compatibility';
import { documentIdSchema, type OpsOperation } from './core';

/**
 * The portal columns, in the pictured order — plus the REQUIRED `email` column
 * the picture never had: a committed row must provision a working
 * users-permissions account, and the create-time provisioning middleware only
 * has a real address to provision from when the row carries one.
 */
export const PORTAL_IMPORT_TEMPLATE_COLUMNS = [
  'given name',
  'family name',
  'email',
  'date of birth',
  'year level',
  'home language',
] as const;

/**
 * Accepted but never emitted in the download: an operator pastes this column in
 * when two students share a name AND a date of birth. It disambiguates without
 * adding a field to the pictured form, and it is never required.
 */
export const PORTAL_IMPORT_TEMPLATE_OPTIONAL_COLUMNS = ['student key'] as const;

/**
 * The legacy (unversioned) columns, in download order. Every one must be
 * present in the header; `proficiency level` is the only cell that may be
 * blank. A student needs an email, a date of birth and a year level to sit a
 * test and be reported, so the legacy vocabulary carries them too.
 */
export const LEGACY_IMPORT_TEMPLATE_COLUMNS = [
  'first name',
  'last name',
  'email',
  'date of birth',
  'year level',
  'first language',
  'class',
  'proficiency level',
] as const;

/** Portal date-of-birth wire format and the inclusive year-level bounds. */
export const PORTAL_IMPORT_DOB_FORMAT = 'YYYY-MM-DD';
export const PORTAL_IMPORT_YEAR_LEVEL_MIN = 7;
export const PORTAL_IMPORT_YEAR_LEVEL_MAX = 12;

/**
 * The ONE template filename, for every school, every class and every import:
 * the download is the same file everywhere, so it carries no scope slug. The
 * Content-Disposition header always carries exactly this value (it used to be
 * only the fallback for an unreadable header — that case cannot differ now).
 */
export const IMPORT_TEMPLATE_FILENAME = 'student-import-template.csv';

/** One example row per vocabulary. Invented people, never a seeded student. */
const PORTAL_SAMPLE: Readonly<Record<string, string>> = Object.freeze({
  'given name': 'Sample',
  'family name': 'Student',
  // RFC 2606 reserved domain: deliverable to nobody, so a sample row that is
  // committed by accident cannot reach a real person.
  email: 'sample.student@example.com',
  'date of birth': '2013-03-04',
  'year level': '8',
  'home language': 'english',
});

const LEGACY_SAMPLE: Readonly<Record<string, string>> = Object.freeze({
  'first name': 'Sample',
  'last name': 'Student',
  // RFC 2606 reserved domain: deliverable to nobody, so a sample row that is
  // committed by accident cannot reach a real person.
  email: 'sample.student@example.com',
  'date of birth': '2013-03-04',
  'year level': '8',
  'first language': 'english',
  'proficiency level': 'emerging',
});

/** The columns a request in `mode` must download. */
export function importTemplateColumns(mode: PortalMode): readonly string[] {
  return mode === 'versioned' ? PORTAL_IMPORT_TEMPLATE_COLUMNS : LEGACY_IMPORT_TEMPLATE_COLUMNS;
}

/**
 * The single sample row for `mode`.
 *
 * The legacy vocabulary carries a `class` column and the parser rejects a class
 * the school does not have, so the caller supplies a REAL school-scoped class
 * label. A school with no classes yet gets `null` — a header-only template that
 * the parser still accepts — rather than a sample row that would reject on its
 * own template.
 */
export function importTemplateSampleRow(
  mode: PortalMode,
  className: string | null,
): Readonly<Record<string, string>> | null {
  if (mode === 'versioned') return PORTAL_SAMPLE;
  if (className === null || className.trim() === '') return null;
  return { ...LEGACY_SAMPLE, class: className };
}

/**
 * Query string. Strict: an unknown or misspelt key is a 400, never a silently
 * ignored filter that would hand back a template for the wrong class.
 */
export const importTemplateQuerySchema = z.strictObject({
  class_documentId: documentIdSchema.optional(),
});
export type ImportTemplateQuery = z.infer<typeof importTemplateQuerySchema>;

/** The 200 body is the CSV document itself, not a JSON envelope. */
export const importTemplateResponseSchema = z.string().min(1);

export const ImportTemplateOperation: OpsOperation<
  typeof importTemplateQuerySchema,
  typeof importTemplateResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-046',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/import-students/template.csv',
  request: importTemplateQuerySchema,
  response: importTemplateResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
