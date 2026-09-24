import { z } from 'zod';

import { CMS_PAGE_TYPES, CMS_SECTION_COMPONENTS } from '@/modules/cms/constants/cms.constants';
import { blocksSchema } from '@/modules/cms/schemas/cms-blocks.schema';

export const mediaSchema = z.object({
  url: z.string().min(1),
  alternativeText: z.string().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  mime: z.string().nullish(),
});

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  openInNewTab: z.boolean().nullish(),
});

export const seoSchema = z.object({
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  canonicalUrl: z.string().nullish(),
  noindex: z.boolean().nullish(),
  keywords: z.string().nullish(),
  ogImage: mediaSchema.nullish(),
});

export const authorSchema = z.object({
  name: z.string().min(1),
  slug: z.string().nullish(),
  jobTitle: z.string().nullish(),
  bio: z.string().nullish(),
  url: z.string().nullish(),
  avatar: mediaSchema.nullish(),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: blocksSchema,
});

const sectionBase = { id: z.number() };

export const richTextSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.rich-text'),
  body: blocksSchema,
});

export const headingTextSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.heading-text'),
  heading: z.string().min(1),
  anchor: z.string().nullish(),
  body: blocksSchema,
});

export const faqListSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.faq-list'),
  title: z.string().nullish(),
  faqs: z.array(faqSchema).default([]),
});

export const keyTakeawaysSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.key-takeaways'),
  title: z.string().nullish(),
  items: z.array(z.object({ text: z.string().min(1) })).default([]),
});

export const calloutSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.callout'),
  tone: z.enum(['info', 'warning', 'success']).default('info'),
  title: z.string().nullish(),
  body: blocksSchema,
});

export const mediaSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.media'),
  caption: z.string().nullish(),
  image: mediaSchema.nullish(),
});

export const ctaSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.cta'),
  heading: z.string().min(1),
  text: z.string().nullish(),
  primaryLink: linkSchema.nullish(),
  secondaryLink: linkSchema.nullish(),
});

export const contactBlockSectionSchema = z.object({
  ...sectionBase,
  __component: z.literal('sections.contact-block'),
  heading: z.string().min(1),
  text: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  note: z.string().nullish(),
});

/** A section type added in Strapi before this renderer knows it: parsed, then skipped. */
const unknownSectionSchema = z
  .object({ id: z.number(), __component: z.string() })
  .refine((section) => !(CMS_SECTION_COMPONENTS as readonly string[]).includes(section.__component))
  .transform((section) => ({ id: section.id, __component: 'unknown' as const }));

export const sectionSchema = z.union([
  richTextSectionSchema,
  headingTextSectionSchema,
  faqListSectionSchema,
  keyTakeawaysSectionSchema,
  calloutSectionSchema,
  mediaSectionSchema,
  ctaSectionSchema,
  contactBlockSectionSchema,
  unknownSectionSchema,
]);

export const cmsPageSummarySchema = z.object({
  documentId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().nullish(),
  pageType: z.enum(CMS_PAGE_TYPES),
  publishedDate: z.string().nullish(),
  updatedDate: z.string().nullish(),
  locale: z.string().min(1),
  updatedAt: z.string().min(1),
  publishedAt: z.string().nullish(),
  author: authorSchema.nullish(),
  coverImage: mediaSchema.nullish(),
  seo: seoSchema.nullish(),
});

export const cmsPageSchema = cmsPageSummarySchema.extend({
  version: z.string().nullish(),
  showTableOfContents: z.boolean().nullish(),
  sections: z.array(sectionSchema).default([]),
});

export const cmsPageResponseSchema = z.object({ data: cmsPageSchema, meta: z.unknown() });

export const cmsPageListResponseSchema = z.object({
  data: z.array(cmsPageSummarySchema),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      pageCount: z.number(),
      total: z.number(),
    }),
  }),
});

export const cmsLayoutSchema = z.object({
  headerLinks: z.array(linkSchema).default([]),
  footerGroups: z.array(z.object({ title: z.string().min(1), links: z.array(linkSchema).default([]) })).default([]),
  footerNote: z.string().nullish(),
  copyright: z.string().nullish(),
  locale: z.string().min(1),
});

export const cmsLayoutResponseSchema = z.object({ data: cmsLayoutSchema, meta: z.unknown() });
