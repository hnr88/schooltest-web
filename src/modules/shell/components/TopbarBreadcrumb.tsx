'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/modules/design-system';
import { buildTrail } from '@/modules/navigation';
import { CRUMB_LINK_CLASSES } from '@/modules/shell/constants/crumb.constants';
import {
  useRecordCrumbAncestors,
  useRecordCrumbLabel,
} from '@/modules/shell/hooks/use-record-crumb';

// The app's ONLY dashboard breadcrumb (canonical Child profile header:
// "My children / Emma Hansen" — one row, "/" separator in #CBD5E1, the current
// page in 600). The trail now comes from the SHARED buildTrail registry
// (@/modules/navigation) instead of a two-level section lookup, so a deep route
// such as /dashboard/school/classes/<id> renders every level instead of
// dead-ending at "School". The record segment still takes its human label from
// useRecordCrumb / <RecordCrumb />, so a raw documentId is never shown.
//
// Middle crumbs hide below `sm` so a four-level trail never makes the page
// scroll sideways at 375px; the first and current crumbs always survive.
function TopbarBreadcrumb() {
  const t = useTranslations();
  const pathname = usePathname();
  const recordLabel = useRecordCrumbLabel(pathname);
  const recordLabels = useRecordCrumbAncestors(pathname);
  const { crumbs } = buildTrail(pathname, { recordLabel, recordLabels, includeRoot: false });

  return (
    <Breadcrumb aria-label={t('Shell.topbar.breadcrumbLabel')} className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 ? (
              <BreadcrumbSeparator
                className={crumb.isCurrent ? 'text-input' : 'text-input max-sm:hidden'}
              >
                /
              </BreadcrumbSeparator>
            ) : null}
            <BreadcrumbItem className={crumb.isCurrent ? 'min-w-0' : 'min-w-0 max-sm:hidden'}>
              {crumb.isCurrent ? (
                <BreadcrumbPage
                  data-slot="topbar-page-title"
                  className="truncate font-semibold text-foreground"
                >
                  {crumb.isRecord ? (crumb.label ?? recordLabel) : t(crumb.labelKey)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />} className={CRUMB_LINK_CLASSES}>
                  {crumb.isRecord ? (crumb.label ?? recordLabel) : t(crumb.labelKey)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { TopbarBreadcrumb };
