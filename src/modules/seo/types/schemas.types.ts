import type { REVALIDATE_TAGS } from '@/modules/seo/schemas/revalidate.schema';

export type RevalidateTag = (typeof REVALIDATE_TAGS)[number];
