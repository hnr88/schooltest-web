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
import { z } from 'zod';

import { dataEnvelope } from './core';

/** The four documents the public site exposes (the api's own path enum). */
export const LEGAL_SLUGS = [
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'gdpr',
] as const;
export const legalSlugSchema = z.enum(LEGAL_SLUGS);
export type LegalSlug = z.infer<typeof legalSlugSchema>;

export const legalSectionSchema = z.object({
  id: z.string().trim().min(1).max(60),
  heading: z.string().trim().min(1).max(200),
  paragraphs: z.array(z.string().trim().min(1)).min(1),
  list: z.array(z.string().trim().min(1)).min(1).optional(),
});
export type LegalSection = z.infer<typeof legalSectionSchema>;

export const legalDocumentRowSchema = z.object({
  documentId: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  version: z.string(),
  effective_date: z.string(),
  locale_code: z.string(),
  updatedAt: z.string(),
});
export type LegalDocumentRow = z.infer<typeof legalDocumentRowSchema>;

export const legalDocumentDetailSchema = legalDocumentRowSchema.extend({
  sections: z.array(legalSectionSchema),
});
export type LegalDocumentDetail = z.infer<typeof legalDocumentDetailSchema>;

export const legalUpdateBodySchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200).optional(),
    summary: z.string().trim().max(600).nullable().optional(),
    sections: z.array(legalSectionSchema).min(1).optional(),
    version: z.string().trim().min(1).max(20).optional(),
    effective_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_date must be YYYY-MM-DD')
      .optional(),
    published: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'at least one field is required',
  });
export type LegalUpdateBody = z.infer<typeof legalUpdateBodySchema>;

export const legalDocumentResponseSchema = z.object({ data: legalDocumentDetailSchema });
export type LegalDocumentResponse = z.infer<typeof legalDocumentResponseSchema>;

export const legalUpdateResponseSchema = z.object({ data: legalDocumentDetailSchema });
export type LegalUpdateResponse = z.infer<typeof legalUpdateResponseSchema>;

const LEGAL_ERRORS = [400, 401, 403, 404, 429, 500] as const;

export const LegalDocumentReadOperation = Object.freeze({
  contractId: 'C-LEG-02',
  method: 'GET',
  path: '/api/legal-documents/:slug',
  request: dataEnvelope(z.object({})),
  response: legalDocumentResponseSchema,
  success: 200,
  errors: Object.freeze(LEGAL_ERRORS),
});

export const LegalUpdateOperation = Object.freeze({
  contractId: 'C-LEG-03',
  method: 'PUT',
  path: '/api/ops/legal-documents/:slug',
  request: legalUpdateBodySchema,
  response: legalUpdateResponseSchema,
  success: 200,
  errors: Object.freeze(LEGAL_ERRORS),
});

/** `:slug` substituted for the wire; the operations keep the contract shape. */
export function legalDocumentReadPath(slug: LegalSlug): string {
  return `/api/legal-documents/${slug}`;
}

export function legalUpdatePath(slug: LegalSlug): string {
  return `/api/ops/legal-documents/${slug}`;
}
