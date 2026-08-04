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
export {
  NOINDEX_ROBOTS,
  OG_ACCENT,
  OG_BACKGROUND,
  OG_FOREGROUND,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from '@/modules/seo/constants/seo.constants';
export {
  DISALLOWED_PATHS,
  PUBLIC_ROUTES,
  isDisallowed,
} from '@/modules/seo/constants/public-routes';
export { buildLlmsTxt } from '@/modules/seo/lib/build-llms-txt';
export {
  REVALIDATE_TAGS,
  revalidateRequestSchema,
} from '@/modules/seo/schemas/revalidate.schema';
export { OgCard } from '@/modules/seo/components/OgCard';
export type {
  BreadcrumbJsonLdItem,
  BuildLlmsTxtInput,
  PublicRoute,
  BuildPageMetadataInput,
  JsonLdNode,
  JsonLdValue,
  OrganizationInput,
  WebPageInput,
} from '@/modules/seo/types/seo.types';
export type { RevalidateTag } from './types/schemas.types';
