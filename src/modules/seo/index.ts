export { buildPageMetadata } from '@/modules/seo/lib/build-metadata';
export { JsonLd } from '@/modules/seo/components/JsonLd';
export { BreadcrumbJsonLd } from '@/modules/seo/components/BreadcrumbJsonLd';
export { PublicPageJsonLd } from '@/modules/seo/components/PublicPageJsonLd';
export { absoluteUrl, buildBreadcrumbJsonLd } from '@/modules/seo/lib/breadcrumb-json-ld';
export {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from '@/modules/seo/lib/json-ld';
export { NOINDEX_ROBOTS, SITE_NAME } from '@/modules/seo/constants/seo.constants';
export type {
  BreadcrumbJsonLdItem,
  BuildPageMetadataInput,
  JsonLdNode,
  JsonLdValue,
  OrganizationInput,
  WebPageInput,
} from '@/modules/seo/types/seo.types';
