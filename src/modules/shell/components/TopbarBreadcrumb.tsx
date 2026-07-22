'use client';

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
import { useRecordCrumbLabel } from '@/modules/shell/hooks/use-record-crumb';
import { getShellRouteMeta } from '@/modules/shell/lib/route-meta';

// The app's ONLY breadcrumb (canonical Child profile header: "My children /
// Emma Hansen" — one row, "/" separator in #CBD5E1, the record in 600). Route meta
// gives the section; a record page appends the last crumb through
// useRecordCrumb / <RecordCrumb />, so the trail ends at the record instead of
// dead-ending at the section and forcing a second breadcrumb into <main>.
// Links keep their 20px canonical text box; the ::after inset takes the pointer
// target to 44px.
const CRUMB_LINK_CLASSES =
  'relative inline-flex rounded-sm text-muted-foreground transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-3 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none';

function TopbarBreadcrumb() {
  const t = useTranslations('Shell');
  const pathname = usePathname();
  const route = getShellRouteMeta(pathname);
  const sectionLabel = t(`nav.${route.labelKey}`);
  const recordLabel = useRecordCrumbLabel(pathname);

  return (
    <Breadcrumb aria-label={t('topbar.breadcrumbLabel')} className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-2 text-sm">
        <BreadcrumbItem className="max-sm:hidden">
          <BreadcrumbLink render={<Link href="/dashboard" />} className={CRUMB_LINK_CLASSES}>
            {t('topbar.dashboard')}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-input max-sm:hidden">/</BreadcrumbSeparator>
        <BreadcrumbItem className="min-w-0">
          {recordLabel ? (
            <BreadcrumbLink render={<Link href={route.href} />} className={CRUMB_LINK_CLASSES}>
              {sectionLabel}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage
              data-slot="topbar-page-title"
              className="truncate font-semibold text-foreground"
            >
              {sectionLabel}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {recordLabel ? (
          <>
            <BreadcrumbSeparator className="text-input">/</BreadcrumbSeparator>
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage
                data-slot="topbar-page-title"
                className="truncate font-semibold text-foreground"
              >
                {recordLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { TopbarBreadcrumb };
