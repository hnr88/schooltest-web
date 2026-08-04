import type { z } from 'zod';

import type { legalDocumentSchema, legalDocumentSummarySchema, legalSectionSchema } from '@/modules/legal/schemas/legal-document.schema';
import type { LEGAL_SLUGS } from '@/modules/legal/constants/schemas.constants';

export type LegalSlug = (typeof LEGAL_SLUGS)[number];
export type LegalSection = z.infer<typeof legalSectionSchema>;
export type LegalDocumentSummary = z.infer<typeof legalDocumentSummarySchema>;
export type LegalDocument = z.infer<typeof legalDocumentSchema>;
