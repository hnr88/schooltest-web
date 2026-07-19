import type { CSSProperties, ReactNode } from 'react';

import { ParentGuard } from '@/modules/auth';
import { SidebarInset, SidebarProvider } from '@/modules/design-system';
import { AppSidebar, AppTopbar } from '@/modules/shell';

// C-UI-SHELL: fixed 248px sidebar (primitive default 16rem is wrong — override).
// ParentGuard hoisted here (task 012) so every current and future /dashboard/*
// route is parent-guarded exactly once: skeleton while the auth store hydrates,
// then /sign-in redirect without a token. No middleware/proxy involved.
// D-UI-2 motion baseline (task 065): the content wrapper below the topbar plays
// the contract entrance (animate-in fade-in slide-in-from-bottom-2 duration-300)
// once when the guarded shell mounts; motion-reduce disables it entirely.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ParentGuard>
      <SidebarProvider style={{ '--sidebar-width': '248px' } as CSSProperties}>
        <AppSidebar />
        <SidebarInset>
          <AppTopbar />
          <div
            data-slot="dashboard-content"
            className="flex flex-1 flex-col duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ParentGuard>
  );
}
