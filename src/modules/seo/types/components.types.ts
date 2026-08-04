import type { JsonLdNode } from '@/modules/seo/types/seo.types';

export interface BreadcrumbJsonLdProps {
  /** Locale-less pathname, e.g. `/privacy-policy`. */
  readonly pathname: string;
  readonly locale: string;
  /** Human label for a trailing dynamic segment (article title, …). */
  readonly recordLabel?: string | null;
  /** Overrides the current page's crumb with a data-driven title. */
  readonly currentLabel?: string | null;
}

export interface JsonLdProps {
  readonly data: JsonLdNode;
}

export interface OgCardProps {
  readonly siteName: string;
  readonly title: string;
  readonly tagline: string;
}

export interface PublicPageJsonLdProps {
  readonly pathname: string;
  readonly locale: string;
  readonly title: string;
  readonly description: string;
  /** The site root additionally publishes the Organization + WebSite nodes. */
  readonly isSiteRoot?: boolean;
  readonly datePublished?: string;
  readonly dateModified?: string;
}
