import { z } from 'zod';

import type { CmsBlock, CmsInline, CmsListItem } from '@/modules/cms/types/cms-blocks.types';

const textNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

const linkNodeSchema = z.object({
  type: z.literal('link'),
  url: z.string(),
  children: z.array(textNodeSchema),
});

export const inlineSchema: z.ZodType<CmsInline> = z.union([textNodeSchema, linkNodeSchema]);

const listItemSchema: z.ZodType<CmsListItem> = z.object({
  type: z.literal('list-item'),
  children: z.array(inlineSchema),
});

const listSchema = z.object({
  type: z.literal('list'),
  format: z.enum(['ordered', 'unordered']),
  get children() {
    return z.array(z.union([listItemSchema, listSchema]));
  },
});

const imageBlockSchema = z.object({
  type: z.literal('image'),
  image: z.object({
    url: z.string(),
    alternativeText: z.string().nullish(),
    width: z.number().nullish(),
    height: z.number().nullish(),
  }),
});

/** A block type this renderer does not know yet: kept (so the page still parses) and skipped. */
const unknownBlockSchema = z
  .object({ type: z.string() })
  .refine((block) => !['paragraph', 'heading', 'list', 'quote', 'code', 'image'].includes(block.type))
  .transform(() => ({ type: 'unknown' as const }));

export const blockSchema: z.ZodType<CmsBlock, unknown> = z.union([
  z.object({ type: z.literal('paragraph'), children: z.array(inlineSchema) }),
  z.object({
    type: z.literal('heading'),
    level: z.number().int().min(1).max(6),
    children: z.array(inlineSchema),
  }),
  listSchema,
  z.object({ type: z.literal('quote'), children: z.array(inlineSchema) }),
  z.object({ type: z.literal('code'), children: z.array(inlineSchema) }),
  imageBlockSchema,
  unknownBlockSchema,
]);

export const blocksSchema = z.array(blockSchema);
