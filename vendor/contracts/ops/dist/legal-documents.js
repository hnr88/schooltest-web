"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalUpdateOperation = exports.LegalDocumentReadOperation = exports.legalUpdateResponseSchema = exports.legalDocumentResponseSchema = exports.legalUpdateBodySchema = exports.legalDocumentDetailSchema = exports.legalDocumentRowSchema = exports.legalSectionSchema = exports.legalSlugSchema = exports.LEGAL_SLUGS = void 0;
exports.legalDocumentReadPath = legalDocumentReadPath;
exports.legalUpdatePath = legalUpdatePath;
/**
 * Ledger row 10 (msn-0da39441, D-008) — the ops legal-document editor's two
 * surfaces: `GET /api/legal-documents/:slug` (C-LEG-02, public read the editor
 * hydrates from) and `PUT /api/ops/legal-documents/:slug` (C-LEG-03, ops only).
 *
 * Shapes mirror the live wire byte-for-byte (verified against
 * schooltest-api/src/api/legal-document before writing): the update body is a
 * PARTIAL patch requiring at least one field, and BOTH responses carry the
 * FULL row including its sections. The write always lands on the canonical
 * `en` row — the service filters `locale_code = 'en'` itself — so the editor
 * sends no locale. `published` is a regular column the patch may carry, not
 * the draft/publish system.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
/** The four documents the public site exposes (the api's own path enum). */
exports.LEGAL_SLUGS = [
    'privacy-policy',
    'terms-of-service',
    'cookie-policy',
    'gdpr',
];
exports.legalSlugSchema = zod_1.z.enum(exports.LEGAL_SLUGS);
exports.legalSectionSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1).max(60),
    heading: zod_1.z.string().trim().min(1).max(200),
    paragraphs: zod_1.z.array(zod_1.z.string().trim().min(1)).min(1),
    list: zod_1.z.array(zod_1.z.string().trim().min(1)).min(1).optional(),
});
exports.legalDocumentRowSchema = zod_1.z.object({
    documentId: zod_1.z.string(),
    slug: zod_1.z.string(),
    title: zod_1.z.string(),
    summary: zod_1.z.string().nullable(),
    version: zod_1.z.string(),
    effective_date: zod_1.z.string(),
    locale_code: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.legalDocumentDetailSchema = exports.legalDocumentRowSchema.extend({
    sections: zod_1.z.array(exports.legalSectionSchema),
});
exports.legalUpdateBodySchema = zod_1.z
    .strictObject({
    title: zod_1.z.string().trim().min(1).max(200).optional(),
    summary: zod_1.z.string().trim().max(600).nullable().optional(),
    sections: zod_1.z.array(exports.legalSectionSchema).min(1).optional(),
    version: zod_1.z.string().trim().min(1).max(20).optional(),
    effective_date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_date must be YYYY-MM-DD')
        .optional(),
    published: zod_1.z.boolean().optional(),
})
    .refine((patch) => Object.keys(patch).length > 0, {
    message: 'at least one field is required',
});
exports.legalDocumentResponseSchema = zod_1.z.object({ data: exports.legalDocumentDetailSchema });
exports.legalUpdateResponseSchema = zod_1.z.object({ data: exports.legalDocumentDetailSchema });
const LEGAL_ERRORS = [400, 401, 403, 404, 429, 500];
exports.LegalDocumentReadOperation = Object.freeze({
    contractId: 'C-LEG-02',
    method: 'GET',
    path: '/api/legal-documents/:slug',
    request: (0, core_1.dataEnvelope)(zod_1.z.object({})),
    response: exports.legalDocumentResponseSchema,
    success: 200,
    errors: Object.freeze(LEGAL_ERRORS),
});
exports.LegalUpdateOperation = Object.freeze({
    contractId: 'C-LEG-03',
    method: 'PUT',
    path: '/api/ops/legal-documents/:slug',
    request: exports.legalUpdateBodySchema,
    response: exports.legalUpdateResponseSchema,
    success: 200,
    errors: Object.freeze(LEGAL_ERRORS),
});
/** `:slug` substituted for the wire; the operations keep the contract shape. */
function legalDocumentReadPath(slug) {
    return `/api/legal-documents/${slug}`;
}
function legalUpdatePath(slug) {
    return `/api/ops/legal-documents/${slug}`;
}
