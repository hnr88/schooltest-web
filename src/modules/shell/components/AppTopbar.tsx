'use client';

import { useTranslations } from 'next-intl';

import { SidebarTrigger, TopbarSearchTrigger } from '@/modules/design-system';
import { TopbarBreadcrumb } from '@/modules/shell/components/TopbarBreadcrumb';
import { UserMenu } from '@/modules/shell/components/UserMenu';
import { SEARCH_HREF } from '@/modules/shell/constants/nav.constants';
import { NotificationBell } from '@/modules/notifications';

// Canonical topbar (DS §2.4 / Parent overview + Child profile headers): 64px, white,
// 1px #E3E8F0 bottom border, 32px horizontal padding, ONE row. §2.4 opens with the
// #F1F5F9 search pill, then the context trail; the actions cluster is pinned right.
// The rail toggle keeps its canonical 38px box — only its POINTER target grows,
// via the ::after inset idiom used across the shell. The inset is 6px, not the
// arithmetic 3px: the trigger carries a 1px border, so the pseudo-element's
// containing block is the 36px PADDING box, and 3px resolved to a real
// elementFromPoint target of 42.0x42.0. 6px measures 48.5x48.5.

function AppTopbar() {
  const t = useTranslations('Shell');

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-8 max-md:px-4">
      <SidebarTrigger
        aria-label={t('topbar.toggleNav')}
        className="relative size-9.5 rounded-lg border border-border text-sidebar-foreground transition-colors duration-200 ease-out after:absolute after:-inset-1.5 hover:bg-muted hover:text-foreground motion-reduce:transition-none [&_svg]:size-4.25"
      />
      <TopbarSearchTrigger
        href={SEARCH_HREF}
        placeholder={t('topbar.searchPlaceholder')}
        label={t('topbar.searchLabel')}
        // worstPairs #7: the #F1F5F9 pill on the white topbar is a 1.10:1 surface
        // step with no edge. --input (#CBD5E1) is reserved for "things you can
        // touch" and canonical form fields all carry `border:1px solid #CBD5E1`;
        // it gives the pill a 1.63:1 edge without touching its fill.
        className="border border-input max-lg:hidden"
      />
      <TopbarBreadcrumb />
      <span aria-hidden="true" className="flex-1" />
      <div data-slot="topbar-actions" className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

export { AppTopbar };
