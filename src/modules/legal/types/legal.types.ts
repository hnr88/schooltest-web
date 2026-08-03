import type { z } from 'zod';

import type {
  LEGAL_SLUGS,
  legalDocumentSchema,
  legalDocumentSummarySchema,
  legalSectionSchema,
} from '@/modules/legal/schemas/legal-document.schema';

export type LegalSlug = (typeof LEGAL_SLUGS)[number];
export type LegalSection = z.infer<typeof legalSectionSchema>;
export type LegalDocumentSummary = z.infer<typeof legalDocumentSummarySchema>;
export type LegalDocument = z.infer<typeof legalDocumentSchema>;
