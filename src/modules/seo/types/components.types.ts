import type { AeoPage } from '@/modules/seo/types/aeo.types';
import type { FaqEntry, HowToStepInput, ImageInput } from '@/modules/seo/types/json-ld-input.types';
import type { GraphNode, JsonLdGraph, WebPageType } from '@/modules/seo/types/json-ld.types';
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
  readonly data: JsonLdGraph | JsonLdNode;
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
  readonly pageType?: WebPageType;
  /**
   * Emit the BreadcrumbList inside this page's @graph. Leave unset when the page
   * already renders a separate <BreadcrumbJsonLd> (same @id, so the ref resolves).
   */
  readonly breadcrumb?: boolean | { readonly recordLabel?: string | null; readonly currentLabel?: string | null };
  readonly faq?: readonly FaqEntry[];
  readonly nodes?: readonly GraphNode[];
  readonly aboutId?: string;
  readonly image?: ImageInput;
  /** Marks the H1 + `[data-speakable="summary"]` paragraph as speakable. */
  readonly isSpeakable?: boolean;
}

export interface FaqSectionProps {
  readonly heading: string;
  readonly intro: string;
  readonly entries: readonly FaqEntry[];
}

export interface HowToSectionProps {
  readonly heading: string;
  readonly intro: string;
  readonly steps: readonly HowToStepInput[];
}

export interface LandingPageAeoProps {
  readonly page: AeoPage;
  /** Locale-less pathname, e.g. `/diagnose`. */
  readonly pathname: string;
  readonly locale: string;
  readonly title: string;
  readonly description: string;
}
