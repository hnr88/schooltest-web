'use client';

import { useTranslations } from 'next-intl';

import { SidebarTrigger, TopbarSearchTrigger } from '@/modules/design-system';
import { parentViewsEnabled } from '@/modules/flags';
import { SchoolSearchLauncher } from '@/modules/school-command';
import { TopbarBreadcrumb } from '@/modules/shell/components/TopbarBreadcrumb';
import { SEARCH_HREF } from '@/modules/shell/constants/nav.constants';
import { NotificationBell } from '@/modules/notifications';
import { BELL_SKIN_CLASSES, CONTROL_CLASSES } from '@/modules/shell/constants/shell-classes.constants';
import { usePathname } from '@/i18n/navigation';

// The detached frame has NO 64px white topbar — the white "L" of chrome is gone with
// the rail's border. What the design draws at the top of the scroll column
// (portal--main.html:7-22) is a bare row on the #EEF1F6 well carrying free-floating
// round white controls: `border-radius:999px; height:44px; background:#FFFFFF;
// box-shadow:0 1px 2px rgba(14,35,80,.05)` on the search field and the 44x44 bell.
// This row is that: transparent, no border, the same 44px pill geometry, aligned to
// the page's own gutter so the breadcrumb sits over the content's left edge.
//
// The rail toggle and the breadcrumb are app contracts the slice has no slot for; they
// take the slice's own control geometry rather than inventing a second one.
// The bell lives in the notifications module (its own owner) — the shell skins it to
// the frame's pill geometry from the outside instead of reaching into that module.
function AppTopbar() {
  const t = useTranslations('Shell');
  const pathname = usePathname();
  // Task 025: inside /dashboard/school the topbar carries the school portal's
  // OWN search — the ⌘K global Search dialog (School Admin Portal artboard
  // shell). Strictly pathname-gated so every other portal is untouched.
  const inSchoolPortal = pathname.startsWith('/dashboard/school');

  return (
    <header className="flex shrink-0 animate-in items-center gap-3 px-4 duration-300 ease-out-expo fade-in slide-in-from-top-2 motion-reduce:animate-none sm:px-6 lg:px-8">
      <SidebarTrigger aria-label={t('topbar.toggleNav')} className={CONTROL_CLASSES} />
      <TopbarBreadcrumb />
      <span aria-hidden="true" className="flex-1" />
      {inSchoolPortal ? (
        <SchoolSearchLauncher className="h-11 shrink-0 gap-2 rounded-full bg-card px-4 shadow-sm transition-[transform,background-color] hover:-translate-y-px hover:bg-card focus-visible:ring-primary motion-reduce:hover:translate-y-0" />
      ) : (
        parentViewsEnabled() && (
          <TopbarSearchTrigger
            href={SEARCH_HREF}
            placeholder={t('topbar.searchPlaceholder')}
            label={t('topbar.searchLabel')}
            className="h-11 w-60 shrink-0 rounded-full bg-card px-4.5 shadow-sm transition-[transform,color,background-color] hover:-translate-y-px hover:bg-card focus-visible:ring-primary motion-reduce:hover:translate-y-0 max-lg:hidden"
          />
        )
      )}
      <div data-slot="topbar-actions" className={BELL_SKIN_CLASSES}>
        <NotificationBell />
      </div>
    </header>
  );
}

export { AppTopbar };
