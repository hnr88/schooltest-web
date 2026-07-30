import type { ReactNode } from 'react';

import { TeacherGuard } from '@/modules/auth';

// The /dashboard/teach section is teacher-only (spec §15: separate teacher
// dashboard). Shell chrome comes from the dashboard layout above; this
// boundary adds only the role gate.
export default function TeachLayout({ children }: { children: ReactNode }) {
  return <TeacherGuard>{children}</TeacherGuard>;
}
