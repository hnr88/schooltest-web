import { z } from 'zod';

export const ARTICLE_CATEGORIES = ['news', 'tutorial', 'guide', 'opinion'] as const;

export const createArticleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  excerpt: z.string().max(300, 'Excerpt is too long').optional(),
  content: z.string().optional(),
  category: z.enum(ARTICLE_CATEGORIES),
  featured: z.boolean(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
