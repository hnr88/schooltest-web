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
