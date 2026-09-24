import { buildBreadcrumbJsonLd } from '@/modules/seo/lib/breadcrumb-json-ld';
import { buildFaqQuestionNodes } from '@/modules/seo/lib/json-ld-content';
import { pageIds } from '@/modules/seo/lib/json-ld-ids';
import {
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from '@/modules/seo/lib/json-ld';
import type { PublicPageGraphInput } from '@/modules/seo/types/json-ld-input.types';
import type { JsonLdGraph } from '@/modules/seo/types/json-ld.types';

/**
 * The whole structured-data document for one public page, from plain data:
 * Organization + WebSite (so every @id the page points at resolves on the page
 * itself), the WebPage, its BreadcrumbList, the visible FAQ's Question nodes
 * and any page-specific nodes (Service, HowTo, SoftwareApplication, Article).
 * CMS pages call this directly with their own title/description/dates/FAQ.
 */
export function buildPublicPageGraph({
  site,
  page,
  breadcrumb,
  faq = [],
  nodes = [],
  aboutId,
}: PublicPageGraphInput): JsonLdGraph {
  const ids = pageIds(page.pathname, page.locale);
  const questions = buildFaqQuestionNodes(faq, page.pathname, page.locale);
  const hasBreadcrumb = page.pathname !== '/';

  return buildJsonLdGraph([
    buildOrganizationJsonLd(site),
    buildWebSiteJsonLd(site),
    buildWebPageJsonLd({
      ...page,
      hasBreadcrumb,
      aboutId,
      questionIds: questions.map((question) => question['@id']),
    }),
    ...(hasBreadcrumb && breadcrumb && breadcrumb.length > 0
      ? [buildBreadcrumbJsonLd(breadcrumb, ids.breadcrumb)]
      : []),
    ...questions,
    ...nodes,
  ]);
}
