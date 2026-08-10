import {
  ClipboardList,
  LayoutDashboard,
  Search,
  Settings,
  SquareCheckBig,
  Users,
} from 'lucide-react';

import { TEACHER_ROLE_TYPE } from '@/modules/auth';
import type { NavGroup, NavGroupLabelKey, NavItem } from '@/modules/shell/types/shell.types';

// The one reachable search surface (unified search). The topbar trigger pill points
// here — no invented route, no dead control.
export const SEARCH_HREF = '/dashboard/search';

// The teacher rail (.qa/DECISIONS.md A4 + .qa/DESIGN.md "Sidebar"): exactly
// Dashboard · Test sessions · Results under the "Teach" overline. `/dashboard` is
// shared with the parent Overview — same route, different persona content — so the
// teacher's first entry is a relabelled destination, not a new one.
export const TEACHER_DASHBOARD_HREF = '/dashboard';
export const TEST_SESSIONS_HREF = '/dashboard/test-sessions';
export const RESULTS_HREF = '/dashboard/results';

// The four parent destinations are subtracted from the teacher rail rather than
// deleted: a parent and a school admin keep the nav they already had.
const NOT_FOR_TEACHERS: readonly string[] = [TEACHER_ROLE_TYPE];
const TEACHERS_ONLY: readonly string[] = [TEACHER_ROLE_TYPE];

// `/dashboard/reports` (C-4 / C-11) is NOT listed here any more. Per A4 the route
// survives and still answers for a teacher; it simply leaves the rail, because the
// brief caps the teacher at three entries and Results replaces it.
export const NAV_ITEMS: readonly NavItem[] = [
  {
    labelKey: 'overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
    group: 'primary',
    hiddenForRoles: NOT_FOR_TEACHERS,
  },
  {
    labelKey: 'myChildren',
    href: '/dashboard/children',
    icon: Users,
    exact: false,
    group: 'primary',
    hiddenForRoles: NOT_FOR_TEACHERS,
  },
  {
    labelKey: 'search',
    href: SEARCH_HREF,
    icon: Search,
    exact: false,
    group: 'primary',
    hiddenForRoles: NOT_FOR_TEACHERS,
  },
  {
    labelKey: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
    exact: false,
    group: 'primary',
    hiddenForRoles: NOT_FOR_TEACHERS,
  },
  {
    labelKey: 'teacherDashboard',
    href: TEACHER_DASHBOARD_HREF,
    icon: LayoutDashboard,
    exact: true,
    group: 'teach',
    roles: TEACHERS_ONLY,
  },
  {
    labelKey: 'testSessions',
    href: TEST_SESSIONS_HREF,
    icon: ClipboardList,
    exact: false,
    group: 'teach',
    roles: TEACHERS_ONLY,
  },
  {
    labelKey: 'results',
    href: RESULTS_HREF,
    icon: SquareCheckBig,
    exact: false,
    group: 'teach',
    roles: TEACHERS_ONLY,
  },
];

// Render order of the rail's sections, and the catalog key each overline reads.
export const NAV_GROUP_ORDER: readonly NavGroup[] = ['primary', 'teach'];

export const NAV_GROUP_LABEL_KEYS: Record<NavGroup, NavGroupLabelKey> = {
  primary: 'manage',
  teach: 'teach',
};
