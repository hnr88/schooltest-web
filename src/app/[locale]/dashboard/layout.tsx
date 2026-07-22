import type { CSSProperties, ReactNode } from 'react';

import { ParentGuard } from '@/modules/auth';
import { SidebarInset, SidebarProvider } from '@/modules/design-system';
import { AppSidebar, AppTopbar } from '@/modules/shell';

// C-UI-SHELL: fixed 248px sidebar (primitive default 16rem is wrong — override).
// ParentGuard hoisted here (task 012) so every current and future /dashboard/*
// route is parent-guarded exactly once: skeleton while the auth store hydrates,
// then /sign-in redirect without a token. No middleware/proxy involved.
//
// The WELL (.qa/CONTRAST-SPEC.md → sidebarSpec §2): canonical never tints the rail
// — 33 asides resolve to #FFFFFF or #0E2350 and nothing in between. The rail and
// the 64px topbar are one continuous white chrome "L", so the way to give that L
// an edge is to deepen the field it frames, not to tint the frame. bg-surface-well
// (#EEF2F7) lands on the scroll container ONLY; --background stays #F7F9FC because
// ~12 "recess inside white" usages (segmented-control thumb, outline-button hover,
// DashboardActionLink hover, ChildrenRosterSkeleton) depend on that value and would
// silently invert. One class, five of the nine measured 1.05:1 boundaries.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ParentGuard>
      <SidebarProvider
        className="h-svh min-h-0 overflow-hidden"
        style={{ '--sidebar-width': '248px' } as CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <AppTopbar />
          <div
            data-slot="dashboard-content"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-smooth bg-surface-well motion-reduce:scroll-auto"
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ParentGuard>
  );
}
