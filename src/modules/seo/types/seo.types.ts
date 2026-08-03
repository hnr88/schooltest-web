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
  readonly ogType?: 'website' | 'article';
  /** Private surfaces set this so robots stay out of the dashboard. */
  readonly noindex?: boolean;
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
}
