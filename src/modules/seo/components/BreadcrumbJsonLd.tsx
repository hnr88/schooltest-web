import { getTranslations } from 'next-intl/server';

import { JsonLd } from '@/modules/seo/components/JsonLd';
import { buildBreadcrumbJsonLd } from '@/modules/seo/lib/breadcrumb-json-ld';
import { buildJsonLdGraph } from '@/modules/seo/lib/json-ld';
import { pageIds } from '@/modules/seo/lib/json-ld-ids';
import { resolveBreadcrumbItems } from '@/modules/seo/lib/resolve-breadcrumb';

import type { BreadcrumbJsonLdProps } from '@/modules/seo/types/components.types';

// Server Component. Emits schema.org BreadcrumbList for a public page from the
// SAME buildTrail derivation that renders <PublicBreadcrumb>, so the structured
// data and the DOM crumbs always carry identical names in identical order. It
// carries the page's `#breadcrumb` @id, which the WebPage node references.
async function BreadcrumbJsonLd({
  pathname,
  locale,
  recordLabel = null,
  currentLabel = null,
}: BreadcrumbJsonLdProps) {
  const t = await getTranslations({ locale });
  const items = resolveBreadcrumbItems({
    pathname,
    locale,
    translate: (key) => t(key),
    recordLabel,
    currentLabel,
  });

  return (
    <JsonLd
      data={buildJsonLdGraph([buildBreadcrumbJsonLd(items, pageIds(pathname, locale).breadcrumb)])}
    />
  );
}

export { BreadcrumbJsonLd };
