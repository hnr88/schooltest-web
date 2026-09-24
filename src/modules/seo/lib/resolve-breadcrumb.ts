import { routing } from '@/i18n/routing';
import { buildTrail } from '@/modules/navigation';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import type { BreadcrumbJsonLdItem } from '@/modules/seo/types/seo.types';

interface ResolveBreadcrumbInput {
  readonly pathname: string;
  readonly locale: string;
  readonly translate: (key: string) => string;
  readonly recordLabel?: string | null;
  readonly currentLabel?: string | null;
}

/** The SAME buildTrail derivation <PublicBreadcrumb> renders, resolved to labels + absolute URLs. */
export function resolveBreadcrumbItems({
  pathname,
  locale,
  translate,
  recordLabel = null,
  currentLabel = null,
}: ResolveBreadcrumbInput): BreadcrumbJsonLdItem[] {
  const { crumbs } = buildTrail(pathname, { recordLabel, currentLabel, includeRoot: true });
  return crumbs.map((crumb) => ({
    name: crumb.isRecord
      ? (crumb.isCurrent ? (currentLabel ?? recordLabel ?? '') : (recordLabel ?? ''))
      : translate(crumb.labelKey),
    url: absoluteUrl(crumb.href, locale, routing.defaultLocale),
  }));
}
