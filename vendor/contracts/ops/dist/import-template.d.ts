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
 *  - LEGACY (no `X-Ops-Portal-Version` header) is the six-column, email-keyed
 *    template the CURRENT preview/commit parser accepts, unchanged. A caller
 *    that omits the header must keep downloading a file that still imports.
 *  - PORTAL (`X-Ops-Portal-Version: 1`) is the pictured template
 *    (mvp/ops/Ops Portal.dc.html:802): given name, family name, date of birth,
 *    year level, home language. The class comes from the modal's "Add to class"
 *    picker, never from a CSV column, and no email is required or invented.
 *
 * Pure data + pure functions: no Strapi, no DOM, no node builtins, because both
 * applications import this file.
 */
import { z } from 'zod';
import type { PortalMode } from './compatibility';
import { type OpsOperation } from './core';
/** The pictured portal columns, in the pictured order. */
export declare const PORTAL_IMPORT_TEMPLATE_COLUMNS: readonly ["given name", "family name", "date of birth", "year level", "home language"];
/**
 * Accepted but never emitted in the download: an operator pastes this column in
 * when two students share a name AND a date of birth. It disambiguates without
 * adding a field to the pictured form, and it is never required.
 */
export declare const PORTAL_IMPORT_TEMPLATE_OPTIONAL_COLUMNS: readonly ["student key"];
/** The six columns today's preview/commit parser requires. Frozen by D-COMPAT. */
export declare const LEGACY_IMPORT_TEMPLATE_COLUMNS: readonly ["first name", "last name", "email", "first language", "class", "proficiency level"];
/** Portal date-of-birth wire format and the inclusive year-level bounds. */
export declare const PORTAL_IMPORT_DOB_FORMAT = "YYYY-MM-DD";
export declare const PORTAL_IMPORT_YEAR_LEVEL_MIN = 7;
export declare const PORTAL_IMPORT_YEAR_LEVEL_MAX = 12;
/** Used when the response's Content-Disposition is unreadable (no CORS expose). */
export declare const IMPORT_TEMPLATE_FALLBACK_FILENAME = "student-import-template.csv";
/** The columns a request in `mode` must download. */
export declare function importTemplateColumns(mode: PortalMode): readonly string[];
/**
 * The single sample row for `mode`.
 *
 * The legacy vocabulary carries a `class` column and the parser rejects a class
 * the school does not have, so the caller supplies a REAL school-scoped class
 * label. A school with no classes yet gets `null` — a header-only template that
 * the parser still accepts — rather than a sample row that would reject on its
 * own template.
 */
export declare function importTemplateSampleRow(mode: PortalMode, className: string | null): Readonly<Record<string, string>> | null;
/**
 * A safe, scope-specific attachment filename: ASCII, lowercase, no quotes, no
 * path separators, no spaces — so it cannot break the `Content-Disposition`
 * header or escape a download directory. A scope that slugifies to nothing
 * (e.g. a school named only in a non-Latin script) falls back to the stem
 * instead of producing `student-import-template-.csv`.
 */
export declare function importTemplateFilename(scope: string | null | undefined): string;
/**
 * Query string. Strict: an unknown or misspelt key is a 400, never a silently
 * ignored filter that would hand back a template for the wrong class.
 */
export declare const importTemplateQuerySchema: z.ZodObject<{
    class_documentId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type ImportTemplateQuery = z.infer<typeof importTemplateQuerySchema>;
/** The 200 body is the CSV document itself, not a JSON envelope. */
export declare const importTemplateResponseSchema: z.ZodString;
export declare const ImportTemplateOperation: OpsOperation<typeof importTemplateQuerySchema, typeof importTemplateResponseSchema>;
