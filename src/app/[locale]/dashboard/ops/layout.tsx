import type { ReactNode } from 'react';

import { OpsGuard } from '@/modules/auth';

// The /dashboard/ops section is ops-only (mvp-updates §4.2: the internal
// SchoolTest console with cross-school visibility). Shell chrome comes from
// the dashboard layout above; this boundary adds only the role gate.
export default function OpsLayout({ children }: { children: ReactNode }) {
  return <OpsGuard>{children}</OpsGuard>;
}
