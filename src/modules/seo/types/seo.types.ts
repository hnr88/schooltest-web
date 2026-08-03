/** A serialisable schema.org node. `@context` is present on top-level nodes only. */
export type JsonLdValue = string | number | boolean | null | JsonLdNode | JsonLdValue[];

export interface JsonLdNode {
  readonly [key: string]: JsonLdValue | undefined;
}

/** One entry of a BreadcrumbList, already resolved to an absolute URL + label. */
export interface BreadcrumbJsonLdItem {
  readonly name: string;
  readonly url: string;
}

/** Input for the shared public-page metadata builder (C-SET-01 supplies the defaults). */
export interface BuildPageMetadataInput {
  readonly title: string;
  readonly description: string;
  /** Locale-less pathname, e.g. `/privacy-policy`. */
  readonly pathname: string;
  readonly locale: string;
  readonly siteName?: string;
  /**
   * Points the canonical at a DIFFERENT path. Used where two routes render the
   * same content and only one should be the indexed original.
   */
  readonly canonicalPath?: string;
  readonly ogType?: 'website' | 'article';
  /** Private surfaces set this so robots stay out of the dashboard. */
  readonly noindex?: boolean;
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
}

/** One entry of the shared public-route registry (sitemap + llms.txt + robots). */
export interface PublicRoute {
  /** Locale-less pathname, e.g. `/eald/diagnose`. */
  readonly pathname: string;
  readonly changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  readonly priority: number;
  /** Full next-intl key for the llms.txt label. */
  readonly llmsLabelKey: string;
}

/** Input for the llms.txt generator: the live legal index plus the locale. */
export interface BuildLlmsTxtInput {
  readonly locale: string;
  readonly legal: readonly { path: string; title: string; summary: string | null }[];
}

/** Publisher-level facts shared by the Organization and WebSite nodes. */
export interface OrganizationInput {
  readonly siteName: string;
  readonly description: string;
  readonly locale: string;
}

/** One public page's WebPage node. */
export interface WebPageInput {
  readonly title: string;
  readonly description: string;
  readonly pathname: string;
  readonly locale: string;
  readonly datePublished?: string;
  readonly dateModified?: string;
}
