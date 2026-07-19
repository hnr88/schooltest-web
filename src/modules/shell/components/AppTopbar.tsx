'use client';

import { useTranslations } from 'next-intl';

import { SidebarTrigger } from '@/modules/design-system';
import { UserMenu } from '@/modules/shell/components/UserMenu';

function AppTopbar() {
  const t = useTranslations('Shell');

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-sidebar-border bg-card px-8">
      <SidebarTrigger className="md:hidden" aria-label={t('topbar.openNav')} />
      <div className="flex-1" />
      <div data-slot="topbar-actions" className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
}

export { AppTopbar };
