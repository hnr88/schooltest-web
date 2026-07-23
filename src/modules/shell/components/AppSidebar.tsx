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
import { useAuth } from '@/modules/auth';
import { RailSectionLabel } from '@/modules/shell/components/RailSectionLabel';
import { SidebarLogoLink } from '@/modules/shell/components/SidebarLogoLink';
import { SidebarNavItem } from '@/modules/shell/components/SidebarNavItem';
import { UserMenu } from '@/modules/shell/components/UserMenu';
import { PRIMARY_NAV_ITEMS, SYSTEM_NAV_ITEMS } from '@/modules/shell/constants/nav.constants';
import { isNavItemActive } from '@/modules/shell/lib/nav-active';
import { filterNavByRole } from '@/modules/shell/lib/nav-visible';

// THE DETACHED RAIL (.qa/design/spec/01 §1.2, portal--detached-sidebar.html:2):
// `width:248px; background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px
// rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06); padding:28px 16px 16px`, floating
// inside the frame's 24px gutter — NOT flush to the viewport edge and NOT bordered.
//
// The vendored primitive paints a flush, full-bleed, right-bordered column, so the
// detachment is done in three moves and only three:
//   1. --sidebar-width is 296px (248 card + 24 left gutter + 24 gap to <main>) and the
//      fixed container carries `p-6`; the CARD is the 248px content box. The gap div
//      the primitive reserves for <main> therefore already includes the gutter.
//   2. `group-data-[side=left]:border-r-0` cancels the primitive's hairline at the
//      same variant key, so tailwind-merge drops `border-r` outright.
//   3. The card surface (radius + float shadow) lands on [data-slot=sidebar-inner],
//      the element that actually paints — reached with an arbitrary VARIANT because
//      the primitive exposes no className for it and ui/ is read-only.
// Collapsed: --sidebar-width-icon is 96px, so the same p-6 leaves a 48px icon card.
// The entrance is the shell's own (the slice has no motion at all, spec §11.1/§11.5):
// the card fades and slides in from the frame edge once on mount — transform and
// opacity only, and nothing at all under prefers-reduced-motion.
const RAIL_CLASSES =
  'h-svh shrink-0 p-6 group-data-[side=left]:border-r-0 max-md:hidden [&_[data-slot=sidebar-inner]]:animate-in [&_[data-slot=sidebar-inner]]:rounded-card [&_[data-slot=sidebar-inner]]:shadow-float [&_[data-slot=sidebar-inner]]:duration-300 [&_[data-slot=sidebar-inner]]:ease-out-expo [&_[data-slot=sidebar-inner]]:fade-in [&_[data-slot=sidebar-inner]]:slide-in-from-left-3 [&_[data-slot=sidebar-inner]]:motion-reduce:animate-none';

function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const t = useTranslations('Shell');
  const primaryNavItems = filterNavByRole(PRIMARY_NAV_ITEMS, user?.role?.type ?? null);

  // collapsible="none" returns before the primitive's isMobile Sheet branch, so it
  // must stay "icon"; max-md:hidden guards the pre-hydration frame (isMobile is false
  // until the media query subscribes). The Sheet branch ignores className entirely,
  // so none of the detach geometry leaks into the 375px nav.
  return (
    <Sidebar collapsible="icon" className={RAIL_CLASSES}>
      <SidebarHeader className="shrink-0 px-4 pt-7 pb-0 group-data-[collapsible=icon]:px-1">
        <SidebarLogoLink />
      </SidebarHeader>
      {/* The COLLAPSED rail is a clipping surface: the vendored SidebarContent adds
          `group-data-[collapsible=icon]:overflow-hidden` and the first nav item sits
          flush against that clip edge, so its hit-area ::after was cut to 43px tall.
          3px of top padding gives the pseudo room inside the clip rectangle and the
          matching negative margin hands the space straight back. */}
      <SidebarContent className="overscroll-contain px-4 group-data-[collapsible=icon]:-mt-0.75 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pt-0.75">
        <nav className="flex flex-1 flex-col">
          <RailSectionLabel>{t('sidebar.groups.manage')}</RailSectionLabel>
          <SidebarMenu className="gap-0.5">
            {primaryNavItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                label={t(`nav.${item.labelKey}`)}
                isActive={isNavItemActive(pathname, item)}
                onNavigate={() => setOpenMobile(false)}
              />
            ))}
          </SidebarMenu>
          {/* portal--detached-sidebar.html:16 — `<div style="flex:1">` is what pushes
              the account group to the bottom. The slice has no divider. */}
          <span aria-hidden="true" className="min-h-6 flex-1" />
          <RailSectionLabel>{t('sidebar.groups.account')}</RailSectionLabel>
          <SidebarMenu className="gap-0.5">
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
      <SidebarFooter className="mt-auto shrink-0 px-4 pt-3.5 pb-4 group-data-[collapsible=icon]:px-1">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };
