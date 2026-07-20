'use client';

import { useTranslations } from 'next-intl';

import {
  Logo,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/modules/design-system';
import { Link, usePathname } from '@/i18n/navigation';
import { NAV_ITEMS } from '@/modules/shell/constants/nav.constants';
import { isNavItemActive } from '@/modules/shell/lib/nav-active';

// Item spec (C-UI-SHELL / C6, soft active): gap 11px, 14px, 10px 12px padding,
// radius 10px; active 600/sidebar-primary on sidebar-accent, hover bg-muted.
// D-UI-2 motion baseline: hover/active recolors transition (~200ms ease-out,
// replacing the primitive's width/height/padding-only transition), never snap.
const MENU_BUTTON_CLASSES =
  'h-auto gap-2.75 rounded-lg px-3 py-2.5 font-medium text-sidebar-foreground transition-colors duration-200 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-accent-foreground data-active:hover:bg-sidebar-accent motion-reduce:transition-none [&_svg]:size-4.25';

function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations('Shell');

  // collapsible="none" returns before the primitive's isMobile Sheet branch, so
  // it must stay "offcanvas" on mobile; max-md:hidden guards the pre-hydration
  // frame (isMobile is false until the media query subscribes).
  return (
    <Sidebar
      collapsible={isMobile ? 'offcanvas' : 'none'}
      className="dark h-svh shrink-0 border-r border-sidebar-border max-md:hidden"
    >
      <SidebarHeader className="shrink-0 px-4 pt-6 pb-0">
        <Link
          href="/dashboard"
          className="mb-5.5 self-start rounded-md transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none motion-reduce:transition-none"
        >
          <Logo theme="white" alt={t('sidebar.logoAlt')} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="overscroll-contain px-4">
        <nav>
          <SidebarMenu className="gap-1.5">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isNavItemActive(pathname, item)}
                  className={MENU_BUTTON_CLASSES}
                  render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                >
                  <item.icon aria-hidden="true" strokeWidth={2} />
                  <span>{t(`nav.${item.labelKey}`)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="mt-auto shrink-0 px-4 pt-0 pb-6" />
    </Sidebar>
  );
}

export { AppSidebar };
