import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { buildTrail } from '@/modules/navigation';
import { JsonLd } from '@/modules/seo/components/JsonLd';
import { absoluteUrl, buildBreadcrumbJsonLd } from '@/modules/seo/lib/breadcrumb-json-ld';

import type { BreadcrumbJsonLdProps } from '@/modules/seo/types/components.types';

// Server Component. Emits schema.org BreadcrumbList for a public page from the
// SAME buildTrail derivation that renders <PublicBreadcrumb>, so the structured
// data and the DOM crumbs always carry identical names in identical order.
async function BreadcrumbJsonLd({
  pathname,
  locale,
  recordLabel = null,
  currentLabel = null,
}: BreadcrumbJsonLdProps) {
  const t = await getTranslations({ locale });
  const { crumbs } = buildTrail(pathname, { recordLabel, currentLabel, includeRoot: true });

  const items = crumbs.map((crumb) => ({
    name: crumb.isRecord
      ? (crumb.isCurrent ? (currentLabel ?? recordLabel ?? '') : (recordLabel ?? ''))
      : t(crumb.labelKey),
    url: absoluteUrl(crumb.href, locale, routing.defaultLocale),
  }));

  return <JsonLd data={buildBreadcrumbJsonLd(items)} />;
}

export { BreadcrumbJsonLd };
