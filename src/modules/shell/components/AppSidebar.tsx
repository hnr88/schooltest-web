'use client';

import { Fragment } from 'react';

import { useTranslations } from 'next-intl';

import {
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/modules/design-system';
import { cn } from '@/lib/utils';
import { usePathname } from '@/i18n/navigation';
import { useAuth } from '@/modules/auth';
import { SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { useTeacherDashboardQuery } from '@/modules/teacher';
import { SchoolSwitcher } from '@/modules/shell/components/SchoolSwitcher';
import { RailSectionLabel } from '@/modules/shell/components/RailSectionLabel';
import { SidebarLogoLink } from '@/modules/shell/components/SidebarLogoLink';
import { SidebarNavItem } from '@/modules/shell/components/SidebarNavItem';
import { UserMenu } from '@/modules/shell/components/UserMenu';
import { ACCOUNT_NAV_ITEMS, NAV_ITEMS, TEST_SESSIONS_HREF } from '@/modules/shell/constants/nav.constants';
import { isNavItemActive } from '@/modules/shell/lib/nav-active';
import { buildNavSections } from '@/modules/shell/lib/nav-sections';
import { filterNavByParentViews, filterNavByRole } from '@/modules/shell/lib/nav-visible';
import { isTeacherFrame } from '@/modules/shell/lib/teacher-frame';
import {
  RAIL_CLASSES,
  TEACHER_FOOTER_RULE_CLASSES,
  TEACHER_LIVE_DOT_CLASSES,
  TEACHER_RAIL_CLASSES,
} from '@/modules/shell/constants/shell-classes.constants';
import type { ShellSkin } from '@/modules/shell/types/shell.types';

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
//
// TEACHER PORTAL V2 (Teacher Portal v2.dc.html:25–53) repaints the card for the
// teacher only: radius 10, a 1px #ECEEF2 border and no float shadow, a 40px logo, the
// design's nav states and a ruled user card. isTeacherFrame() is the one gate, and
// `data-frame` hands it to the page frame (dashboard/layout.tsx).
function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const t = useTranslations('Shell');
  const roleType = user?.role?.type ?? null;
  const teacherFrame = isTeacherFrame(roleType, pathname);
  const skin: ShellSkin = teacherFrame ? 'teacher' : 'default';
  // ONE shell, role filtered (A4). The primary list is split into its rendered
  // sections — "Manage" for the parent/school-admin/ops destinations, "Teach"
  // for the teacher's three — and an empty group renders nothing at all, so a
  // parent never sees a bare Teach overline nor a teacher a bare Manage one.
  // NAV_ITEMS, not PRIMARY_NAV_ITEMS: the teacher's three entries carry
  // `group: 'teach'`, so pre-filtering to `group === 'primary'` dropped them
  // before buildNavSections could ever place them and left a teacher with only
  // the primary items they happened to share. buildNavSections itself restricts
  // the render to NAV_GROUP_ORDER (primary, teach), so `account` still stays out
  // of the scroll area and is rendered from ACCOUNT_NAV_ITEMS in the footer.
  const navSections = buildNavSections(
    filterNavByRole(filterNavByParentViews(NAV_ITEMS), roleType),
  );
  const accountNavItems = filterNavByRole(filterNavByParentViews(ACCOUNT_NAV_ITEMS), roleType);

  // teacher/06 — the rail's live dot (Teacher Portal v2.dc.html:34): the
  // Live-sessions entry pulses while the teacher has ANY live session — C-TD-1's
  // `live_sessions`, the list the design itself counts (`allLive`). OP-2 keeps it a
  // real number: the query never runs for a non-teacher (`enabled`), a
  // failed/in-flight read renders no dot, and the dot is gone on the next read
  // after the last close.
  const isTeacher = roleType === TEACHER_ROLE_TYPE;
  const dashboard = useTeacherDashboardQuery(isTeacher);
  const hasLiveSessions = isTeacher && (dashboard.data?.live_sessions.length ?? 0) > 0;

  // collapsible="none" returns before the primitive's isMobile Sheet branch, so it
  // must stay "icon"; max-md:hidden guards the pre-hydration frame (isMobile is false
  // until the media query subscribes). The Sheet branch ignores className entirely,
  // so none of the detach geometry leaks into the 375px nav.
  return (
    <Sidebar
      collapsible="icon"
      className={teacherFrame ? TEACHER_RAIL_CLASSES : RAIL_CLASSES}
      data-frame={teacherFrame ? 'teacher' : undefined}
    >
      <SidebarHeader className="shrink-0 px-4 pt-7 pb-0 group-data-[collapsible=icon]:px-1">
        <SidebarLogoLink skin={skin} />
        {/* Multi-tenant school switcher (School Admin Portal.dc.html:26–48):
            the school block + "Your schools" menu, for the school_admin rail
            ONLY. Role-gated — every other portal's rail is byte-identical. */}
        {roleType === SCHOOL_ADMIN_ROLE_TYPE ? (
          <div className="pt-5 group-data-[collapsible=icon]:hidden">
            <SchoolSwitcher />
          </div>
        ) : null}
      </SidebarHeader>
      {/* The COLLAPSED rail is a clipping surface: the vendored SidebarContent adds
          `group-data-[collapsible=icon]:overflow-hidden` and the first nav item sits
          flush against that clip edge, so its hit-area ::after was cut to 43px tall.
          3px of top padding gives the pseudo room inside the clip rectangle and the
          matching negative margin hands the space straight back. */}
      <SidebarContent className="overscroll-contain px-4 group-data-[collapsible=icon]:-mt-0.75 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pt-0.75">
        <nav className="flex flex-1 flex-col">
          {navSections.map((section) => (
            <Fragment key={section.group}>
              <RailSectionLabel className={teacherFrame ? 'leading-tight' : undefined}>
                {t(`sidebar.groups.${section.labelKey}`)}
              </RailSectionLabel>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    label={t(`nav.${item.labelKey}`)}
                    isActive={isNavItemActive(pathname, item)}
                    onNavigate={() => setOpenMobile(false)}
                    skin={skin}
                    trailing={
                      item.href === TEST_SESSIONS_HREF && hasLiveSessions ? (
                        <span data-slot="rail-live-dot" aria-hidden="true" className={TEACHER_LIVE_DOT_CLASSES} />
                      ) : undefined
                    }
                  />
                ))}
              </SidebarMenu>
            </Fragment>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter
        className={cn(
          'mt-auto shrink-0 gap-3.5 px-4 pt-3.5 pb-4 group-data-[collapsible=icon]:px-1',
          teacherFrame && 'gap-0 pt-0',
        )}
      >
        {teacherFrame ? <div aria-hidden="true" className={TEACHER_FOOTER_RULE_CLASSES} /> : null}
        {accountNavItems.length > 0 ? (
          <nav aria-label={t('nav.account')} className="flex flex-col gap-3.5">
            <Separator className="bg-divider" />
            <SidebarMenu className="gap-0.5">
              {accountNavItems.map((item) => (
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
        ) : null}
        <UserMenu skin={skin} />
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };
