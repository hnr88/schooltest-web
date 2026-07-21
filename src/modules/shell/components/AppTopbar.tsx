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
  SidebarTrigger,
} from '@/modules/design-system';
import { UserMenu } from '@/modules/shell/components/UserMenu';
import { getShellRouteMeta } from '@/modules/shell/lib/route-meta';
import { NotificationBell } from '@/modules/notifications';

function AppTopbar() {
  const t = useTranslations('Shell');
  const pathname = usePathname();
  const route = getShellRouteMeta(pathname);
  const pageTitle = t(`nav.${route.labelKey}`);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-sidebar-border bg-card px-8">
      <SidebarTrigger aria-label={t('topbar.toggleNav')} />
      <div data-slot="topbar-context" className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Breadcrumb aria-label={t('topbar.breadcrumbLabel')}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/dashboard" />}>
                {t('topbar.dashboard')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p data-slot="topbar-page-title" className="truncate text-base font-bold text-foreground">
          {pageTitle}
        </p>
      </div>
      <div data-slot="topbar-actions" className="flex items-center gap-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

export { AppTopbar };
