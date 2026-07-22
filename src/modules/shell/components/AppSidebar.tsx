'use client';

import { useTranslations } from 'next-intl';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/modules/design-system';
import { usePathname } from '@/i18n/navigation';
import { useStudentsQuery } from '@/modules/dashboard';
import { RailSectionLabel } from '@/modules/shell/components/RailSectionLabel';
import { SidebarLogoLink } from '@/modules/shell/components/SidebarLogoLink';
import { SidebarNavItem } from '@/modules/shell/components/SidebarNavItem';
import { SidebarPromoPanel } from '@/modules/shell/components/SidebarPromoPanel';
import { PRIMARY_NAV_ITEMS, SYSTEM_NAV_ITEMS } from '@/modules/shell/constants/nav.constants';
import { isNavItemActive } from '@/modules/shell/lib/nav-active';

// Canonical PARENT rail (design-system-and-components, Parent overview aside):
// white surface, 1px #E3E8F0 right border, 24px/16px padding, 6px item gap, the
// FULL-COLOUR logo lockup (the inverted one belongs to the school rail's navy
// chrome), a hairline group divider above the account items, and the navy panel
// pinned to the bottom. The previous build put className="dark" here, which
// re-applied the dark palette on top of the drifted light tokens.
//
// The rail STAYS WHITE (.qa/CONTRAST-SPEC.md → sidebarSpec §1). The seam is the
// canonical border + a shadow: ds-Navigation.html:5 gives a light rail BOTH
// `border:1px solid #E3E8F0` and `box-shadow:0 1px 2px rgba(14,35,80,.05)`; this
// rail is 900px tall and position:fixed over scrolling content, which is exactly
// --shadow-md's published role ("raised panel / sticky sidebar"). Verified in the
// running app: the #E3E8F0 hairline paints at x=247 on [data-slot=sidebar-container]
// — the earlier "0px border" reading had sampled sidebar-inner, which never had one.
function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const t = useTranslations('Shell');
  const studentsQuery = useStudentsQuery();
  const childCount = studentsQuery.data?.data.length;

  // collapsible="none" returns before the primitive's isMobile Sheet branch, so
  // it must stay "offcanvas" on mobile; max-md:hidden guards the pre-hydration
  // frame (isMobile is false until the media query subscribes).
  return (
    <Sidebar
      collapsible="icon"
      className="h-svh shrink-0 border-r border-sidebar-border shadow-md max-md:hidden"
    >
      <SidebarHeader className="shrink-0 px-4 pt-6 pb-0 group-data-[collapsible=icon]:px-1">
        <SidebarLogoLink />
      </SidebarHeader>
      {/* The COLLAPSED rail is the third clipping surface in this shell: the vendored
          SidebarContent adds `group-data-[collapsible=icon]:overflow-hidden`, and the
          first nav item sits flush against that clip edge, so its hit-area ::after was
          cut to 43px tall. 3px of top padding gives the pseudo room inside the clip
          rectangle and the matching negative margin hands the space straight back —
          the rail's first icon does not move. */}
      <SidebarContent className="overscroll-contain px-4 group-data-[collapsible=icon]:-mt-0.75 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pt-0.75">
        <nav className="flex flex-col">
          <RailSectionLabel>{t('sidebar.groups.manage')}</RailSectionLabel>
          <SidebarMenu className="gap-1.5">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                label={t(`nav.${item.labelKey}`)}
                isActive={isNavItemActive(pathname, item)}
                count={item.labelKey === 'myChildren' ? childCount : undefined}
                onNavigate={() => setOpenMobile(false)}
              />
            ))}
          </SidebarMenu>
          <div
            aria-hidden="true"
            className="mx-2 my-2.5 h-px bg-divider group-data-[collapsible=icon]:mx-1"
          />
          <RailSectionLabel>{t('sidebar.groups.account')}</RailSectionLabel>
          <SidebarMenu className="gap-1.5">
            {SYSTEM_NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                label={t(`nav.${item.labelKey}`)}
                isActive={isNavItemActive(pathname, item)}
                onNavigate={() => setOpenMobile(false)}
              />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="mt-auto shrink-0 px-4 pt-0 pb-6 group-data-[collapsible=icon]:px-1">
        <SidebarPromoPanel />
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };
