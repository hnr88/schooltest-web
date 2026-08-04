import { z } from 'zod';

/**
 * C-SET-01 — the PUBLIC settings projection. Strict: the server promises this
 * exact allow-list, so a field it never promised (an email credential leaking
 * through a widened projection) fails the parse here instead of reaching a page.
 */
export const publicSettingsSchema = z.strictObject({
  site_name: z.string().min(1),
  site_tagline: z.string().nullable(),
  seo_default_title: z.string().nullable(),
  seo_default_description: z.string().nullable(),
  seo_default_og_image: z.string().nullable(),
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().nullable(),
  announcement_enabled: z.boolean(),
  announcement_message: z.string().nullable(),
  announcement_level: z.enum(['info', 'warning', 'critical']),
  pagination_default_page_size: z.number(),
});

export const publicSettingsResponseSchema = z.object({
  data: publicSettingsSchema,
  meta: z.unknown(),
});
