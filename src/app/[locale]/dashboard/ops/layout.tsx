import type { ReactNode } from 'react';

import { OpsGuard } from '@/modules/auth';
import { OpsPortalCapabilities } from '@/modules/ops/components/OpsPortalCapabilities';

// The /dashboard/ops section is ops-only (mvp-updates §4.2: the internal
// SchoolTest console with cross-school visibility). Shell chrome comes from
// the dashboard layout above; this boundary adds only the role gate.
//
// OPS-075: the capabilities banner sits at the top of every portal screen
// (mvp/ops/Ops Portal.dc.html:49-66), so a read-only support session is
// announced once rather than per page. It is imported by path because the
// `@/modules/ops` barrel is integrated separately; see the returned export
// line for that file.
export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <OpsGuard>
      <div className="flex flex-1 flex-col gap-4">
        <div className="px-4 pt-4 sm:px-6 lg:px-8 empty:hidden">
          <OpsPortalCapabilities />
        </div>
        {children}
      </div>
    </OpsGuard>
  );
}
