import type { CSSProperties, ReactNode } from 'react';

import { ParentGuard } from '@/modules/auth';
import { SidebarInset, SidebarProvider } from '@/modules/design-system';
import { AppSidebar, AppTopbar } from '@/modules/shell';

// C-UI-SHELL: fixed 248px sidebar (primitive default 16rem is wrong — override).
// ParentGuard hoisted here (task 012) so every current and future /dashboard/*
// route is parent-guarded exactly once: skeleton while the auth store hydrates,
// then /sign-in redirect without a token. No middleware/proxy involved.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ParentGuard>
      <SidebarProvider style={{ '--sidebar-width': '248px' } as CSSProperties}>
        <AppSidebar />
        <SidebarInset>
          <AppTopbar />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ParentGuard>
  );
}
