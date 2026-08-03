import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Container,
} from '@/modules/design-system';
import { buildTrail } from '@/modules/navigation/lib/build-trail';
import { PUBLIC_CRUMB_LINK_CLASSES } from '@/modules/navigation/constants/crumb.constants';

interface PublicBreadcrumbProps {
  /** Locale-less pathname, e.g. `/eald/diagnose`. */
  readonly pathname: string;
  /** Human label for a trailing dynamic segment (article title, …). */
  readonly recordLabel?: string | null;
  /** Overrides the current page's crumb with a data-driven title. */
  readonly currentLabel?: string | null;
  readonly className?: string;
}

// Server Component — zero client JS. The trail comes from the shared
// buildTrail registry, the same derivation <BreadcrumbJsonLd> uses, so the
// visible crumbs and the structured data can never disagree.
// The row sits directly under the public header; it wraps rather than scrolls
// so a long trail never makes the page scroll sideways at 375px.
async function PublicBreadcrumb({
  pathname,
  recordLabel = null,
  currentLabel = null,
  className,
}: PublicBreadcrumbProps) {
  const t = await getTranslations();
  const { crumbs } = buildTrail(pathname, { recordLabel, currentLabel, includeRoot: true });

  return (
    <Container className={cn('max-w-eald py-3', className)}>
      <Breadcrumb aria-label={t('Navigation.breadcrumbLabel')}>
        <BreadcrumbList className="gap-2 text-body-sm">
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              {index > 0 ? <BreadcrumbSeparator className="text-input">/</BreadcrumbSeparator> : null}
              <BreadcrumbItem>
                {crumb.isCurrent ? (
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {crumb.isRecord ? (crumb.isCurrent ? (currentLabel ?? recordLabel) : recordLabel) : t(crumb.labelKey)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={crumb.href} />}
                    className={PUBLIC_CRUMB_LINK_CLASSES}
                  >
                    {crumb.isRecord ? (crumb.isCurrent ? (currentLabel ?? recordLabel) : recordLabel) : t(crumb.labelKey)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </Container>
  );
}

export { PublicBreadcrumb };
