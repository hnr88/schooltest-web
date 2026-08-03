import { z } from 'zod';

/** The four documents C-LEG-02 serves. Mirrors the server's slug enum exactly. */
export const LEGAL_SLUGS = [
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'gdpr',
] as const;

export const legalSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  list: z.array(z.string().min(1)).min(1).optional(),
});

export const legalDocumentSummarySchema = z.object({
  documentId: z.string().min(1),
  slug: z.enum(LEGAL_SLUGS),
  title: z.string().min(1),
  summary: z.string().nullable(),
  version: z.string().min(1),
  effective_date: z.string().min(1),
  locale_code: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const legalDocumentSchema = legalDocumentSummarySchema.extend({
  sections: z.array(legalSectionSchema).min(1),
});

/**
 * The WHOLE C-LEG-01 envelope. There is exactly one parse path per endpoint:
 * validate at the boundary, then hand typed data inward. Nothing downstream
 * casts or reshapes.
 */
export const legalDocumentListResponseSchema = z.object({
  data: z.array(legalDocumentSummarySchema),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      pageCount: z.number(),
      total: z.number(),
    }),
  }),
});

/** The WHOLE C-LEG-02 envelope. */
export const legalDocumentResponseSchema = z.object({
  data: legalDocumentSchema,
  meta: z.unknown(),
});
