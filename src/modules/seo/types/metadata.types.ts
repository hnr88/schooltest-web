import type { BuildPageMetadataInput } from '@/modules/seo/types/seo.types';

/** A social card override (per-page OG image); defaults to the generated card. */
export interface MetadataImage {
  readonly url: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly type?: string;
}

/** Input for `buildMetadata` — the page-level builder every public page uses. */
export interface BuildMetadataInput extends BuildPageMetadataInput {
  /** The site root: the title already carries the brand, so no suffix is added. */
  readonly isSiteRoot?: boolean;
  readonly image?: MetadataImage;
  /** Article bylines (`article:author` + `<meta name="author">`). */
  readonly authors?: readonly { name: string; url?: string }[];
  readonly section?: string;
  readonly tags?: readonly string[];
  readonly keywords?: readonly string[];
  /** Locales the content exists in (hreflang + og:locale:alternate); omitted means every locale. */
  readonly alternateLocales?: readonly string[];
}

/** Input for the registry-driven public page metadata (strings from `Seo.pages`). */
export interface PublicPageMetadataInput {
  readonly pathname: string;
  readonly locale: string;
  readonly siteName?: string;
}

/** One public URL as the sitemap and llms.txt see it. */
export interface PublicEntry {
  readonly pathname: string;
  readonly title: string;
  readonly description: string;
  readonly lastModified: string;
  readonly changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  readonly priority: number;
  readonly section: 'pages' | 'articles' | 'legal';
  /** Full plain-text body for llms-full.txt, when the source has one. */
  readonly body?: string;
  readonly images?: readonly string[];
  /** Locales the page exists in; omitted means every locale. */
  readonly locales?: readonly string[];
}


/**
 * One CMS-sourced page or article as the SEO surfaces need it. The CMS module
 * maps its own records to this shape; nothing here depends on its internals.
 */
export interface PublicContentInput {
  /** Locale-less pathname, e.g. `/articles/some-slug`. */
  readonly pathname: string;
  readonly title: string;
  readonly description: string;
  readonly updatedAt: string;
  readonly section: 'pages' | 'articles' | 'legal';
  /** Plain-text body for llms-full.txt. */
  readonly body?: string;
  /** Absolute image URLs for the image sitemap. */
  readonly images?: readonly string[];
  /** Locales the record is published in; omitted means every locale. */
  readonly locales?: readonly string[];
}

/** Shared opening of llms.txt / llms-full.txt plus the helpers both bodies use. */
export interface LlmsHeader {
  readonly lines: string[];
  readonly url: (path: string) => string;
  readonly t: (key: string, values?: Record<string, string>) => string;
}
