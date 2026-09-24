import type { z } from 'zod';

import type {
  authorSchema,
  calloutSectionSchema,
  cmsLayoutSchema,
  cmsPageSchema,
  cmsPageSummarySchema,
  contactBlockSectionSchema,
  ctaSectionSchema,
  faqListSectionSchema,
  faqSchema,
  headingTextSectionSchema,
  keyTakeawaysSectionSchema,
  linkSchema,
  mediaSchema,
  mediaSectionSchema,
  richTextSectionSchema,
  sectionSchema,
  seoSchema,
} from '@/modules/cms/schemas/cms.schema';
import type { CMS_PAGE_TYPES } from '@/modules/cms/constants/cms.constants';

export type CmsPageType = (typeof CMS_PAGE_TYPES)[number];
export type CmsMedia = z.infer<typeof mediaSchema>;
export type CmsLink = z.infer<typeof linkSchema>;
export type CmsSeo = z.infer<typeof seoSchema>;
export type CmsAuthor = z.infer<typeof authorSchema>;
export type CmsFaq = z.infer<typeof faqSchema>;
export type CmsSection = z.infer<typeof sectionSchema>;
export type RichTextSection = z.infer<typeof richTextSectionSchema>;
export type HeadingTextSection = z.infer<typeof headingTextSectionSchema>;
export type FaqListSection = z.infer<typeof faqListSectionSchema>;
export type KeyTakeawaysSection = z.infer<typeof keyTakeawaysSectionSchema>;
export type CalloutSection = z.infer<typeof calloutSectionSchema>;
export type MediaSection = z.infer<typeof mediaSectionSchema>;
export type CtaSection = z.infer<typeof ctaSectionSchema>;
export type ContactBlockSection = z.infer<typeof contactBlockSectionSchema>;
export type CmsPageSummary = z.infer<typeof cmsPageSummarySchema>;
export type CmsPage = z.infer<typeof cmsPageSchema>;
export type CmsLayout = z.infer<typeof cmsLayoutSchema>;

/** A page resolved for one request: `isFallback` when the locale had no entry and `en` was served. */
export interface ResolvedCmsPage {
  readonly page: CmsPage;
  readonly requestedLocale: string;
  readonly isFallback: boolean;
}

export interface CmsPageList {
  readonly items: readonly CmsPageSummary[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}

export interface CmsTocEntry {
  readonly id: string;
  readonly text: string;
}

export interface FeedItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly summary: string;
  readonly publishedAt: string;
  readonly authorName?: string;
}

export interface FeedInput {
  readonly title: string;
  readonly description: string;
  readonly language: string;
  readonly homePageUrl: string;
  readonly feedUrl: string;
  readonly items: readonly FeedItem[];
}
