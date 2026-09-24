import type { ArticleType, GraphNode, WebPageType } from '@/modules/seo/types/json-ld.types';
import type { BreadcrumbJsonLdItem } from '@/modules/seo/types/seo.types';

export interface SiteIds {
  readonly root: string;
  readonly organization: string;
  readonly website: string;
  readonly logo: string;
  readonly software: string;
}

export interface PageIds {
  readonly url: string;
  readonly webpage: string;
  readonly breadcrumb: string;
  readonly primaryImage: string;
  readonly service: string;
  readonly howTo: string;
  readonly article: string;
  readonly question: (key: string) => string;
}

export interface SiteNodeInput {
  readonly siteName: string;
  readonly description: string;
}

export interface ImageInput {
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly caption?: string;
}

export interface PageNodeInput {
  readonly pathname: string;
  readonly locale: string;
  readonly title: string;
  readonly description: string;
  readonly pageType?: WebPageType;
  readonly hasBreadcrumb?: boolean;
  readonly image?: ImageInput;
  readonly datePublished?: string;
  readonly dateModified?: string;
  readonly aboutId?: string;
  readonly questionIds?: readonly string[];
  readonly isSpeakable?: boolean;
}

/** One visible FAQ entry. `key` is stable across locales and becomes the Question @id. */
export interface FaqEntry {
  readonly key: string;
  readonly question: string;
  readonly answer: string;
}

export interface HowToStepInput {
  readonly key: string;
  readonly name: string;
  readonly text: string;
}

export interface HowToInput {
  readonly pathname: string;
  readonly locale: string;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly HowToStepInput[];
}

export interface ServiceInput {
  readonly pathname: string;
  readonly locale: string;
  readonly name: string;
  readonly description: string;
  readonly serviceType: string;
}

export interface SoftwareApplicationInput {
  readonly siteName: string;
  readonly description: string;
  readonly featureList: readonly string[];
}

export interface ArticleAuthorInput {
  readonly name: string;
  readonly url?: string;
}

/** What SEO-3's blog/article pages hand the Article builders. */
export interface ArticleInput {
  readonly type?: ArticleType;
  readonly pathname: string;
  readonly locale: string;
  readonly headline: string;
  readonly description: string;
  readonly datePublished: string;
  readonly dateModified?: string;
  readonly images?: readonly ImageInput[];
  /** Omit or leave empty to credit the Organization itself. */
  readonly authors?: readonly ArticleAuthorInput[];
  readonly body?: string;
  readonly wordCount?: number;
  readonly keywords?: readonly string[];
  readonly articleSection?: string;
}

/** Plain-data input for one page's @graph (landing pages and CMS pages alike). */
export interface PublicPageGraphInput {
  readonly site: SiteNodeInput;
  readonly page: Omit<PageNodeInput, 'hasBreadcrumb' | 'questionIds' | 'aboutId'>;
  /** Resolved trail, root first. Omit when a separate <BreadcrumbJsonLd> already emits it. */
  readonly breadcrumb?: readonly BreadcrumbJsonLdItem[];
  readonly faq?: readonly FaqEntry[];
  readonly nodes?: readonly GraphNode[];
  /** @id of the thing the page is about (its Service or the SoftwareApplication). */
  readonly aboutId?: string;
}
