import { z } from 'zod';

import type { RevalidateTag } from '@/modules/seo/types/schemas.types';
import { REVALIDATE_TAGS } from '@/modules/seo/constants/schemas.constants';

export const revalidateRequestSchema = z.object({
  tags: z.array(z.enum(REVALIDATE_TAGS)).min(1),
});
