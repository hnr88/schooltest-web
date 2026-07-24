import type { CSSProperties, ReactNode } from 'react';

import { DashboardOnboardingGuard } from '@/app/[locale]/dashboard/DashboardOnboardingGuard';
import { ParentGuard } from '@/modules/auth';
import { SidebarInset, SidebarProvider } from '@/modules/design-system';
import { AppSidebar, AppTopbar } from '@/modules/shell';

// THE PORTAL FRAME (.qa/design/spec/01 §1.1, Parent Portal.dc.html:25):
// `display:flex; gap:24px; padding:24px; height:100vh; max-width:1600px; margin:0 auto`
// over a `#EEF1F6` page — a DETACHED rail card beside a bare scroll column, not the
// flush white "L" of chrome this shell used to paint.
//
// The 24px frame padding is split where the primitive can carry it:
//   · left gutter + rail↔main gap live INSIDE --sidebar-width (296px = 24 + 248 + 24),
//     because the rail is position:fixed and only the gap div reserves flow space;
//   · top / bottom / right live on the inset.
// --sidebar-width-icon follows the same arithmetic (24 + 48 + 24), so collapsing the
// rail never moves the gutter.
//
// The 1600px cap lands on the SCROLL COLUMN rather than the whole frame: the vendored
// rail is pinned to the VIEWPORT, so capping the flex wrapper would centre <main>
// while leaving the rail at x=0 and tear a hole between them above 1600px.
//
// ParentGuard stays hoisted here (task 012) so every current and future /dashboard/*
// route is parent-guarded exactly once. The well moved from the scroll container to
// the frame itself — with the rail detached, the background has to run BEHIND it.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ParentGuard>
      <DashboardOnboardingGuard>
        <SidebarProvider
          className="h-svh min-h-0 overflow-hidden bg-surface-well"
          style={{ '--sidebar-width': '296px', '--sidebar-width-icon': '96px' } as CSSProperties}
        >
          <AppSidebar />
          <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-transparent py-4 md:py-6 md:pr-6">
            <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
              <AppTopbar />
              <div
                data-slot="dashboard-content"
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-smooth motion-reduce:scroll-auto"
              >
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DashboardOnboardingGuard>
    </ParentGuard>
  );
}
