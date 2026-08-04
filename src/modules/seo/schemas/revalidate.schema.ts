import { z } from 'zod';

import type { RevalidateTag } from '@/modules/seo/types/schemas.types';

/**
 * Every cache tag the app attaches to a server read. C-WEB-04 accepts ONLY
 * these — an unknown tag is a 400, not a silent no-op, so a typo in an ops
 * action fails loudly instead of appearing to work.
 */
export const REVALIDATE_TAGS = ['legal-documents', 'platform-settings'] as const;

export const revalidateRequestSchema = z.object({
  tags: z.array(z.enum(REVALIDATE_TAGS)).min(1),
});
