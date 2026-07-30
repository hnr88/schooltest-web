import {
  Backpack,
  FileChartColumn,
  GraduationCap,
  LayoutDashboard,
  School,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from 'lucide-react';

import { OPS_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE } from '@/modules/auth';
import type { NavItem } from '@/modules/shell/types/shell.types';

// The one reachable search surface (unified search). The topbar trigger pill points
// here — no invented route, no dead control.
export const SEARCH_HREF = '/dashboard/search';

// Teacher-only report surface (E11-01). Role-scoped rather than unconditional:
// C-11/C-4 answer 403 to a parent, so an always-visible entry would be a dead link.
export const REPORTS_HREF = '/dashboard/reports';

// School admin home (task 27 builds the page; the school-scoped API routes
// answer 403 to every other role, so the whole section is role-scoped).
export const SCHOOL_HREF = '/dashboard/school';

// Ops console home (task 66; the /api/ops routes answer 403 to every non-ops
// role, so the entry is role-scoped like the school admin entries).
export const OPS_HREF = '/dashboard/ops';

export const NAV_ITEMS: readonly NavItem[] = [
  {
    labelKey: 'overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
    group: 'primary',
  },
  {
    labelKey: 'myChildren',
    href: '/dashboard/children',
    icon: Users,
    exact: false,
    group: 'primary',
  },
  {
    labelKey: 'reports',
    href: REPORTS_HREF,
    icon: FileChartColumn,
    exact: false,
    group: 'primary',
    roles: [TEACHER_ROLE_TYPE],
  },
  { labelKey: 'search', href: SEARCH_HREF, icon: Search, exact: false, group: 'primary' },
  {
    labelKey: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
    exact: false,
    group: 'primary',
  },
  {
    labelKey: 'school',
    href: SCHOOL_HREF,
    icon: School,
    exact: true,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'classes',
    href: '/dashboard/school/classes',
    icon: GraduationCap,
    exact: false,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'children',
    href: '/dashboard/school/children',
    icon: Backpack,
    exact: false,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'teachers',
    href: '/dashboard/school/teachers',
    icon: UsersRound,
    exact: false,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'ops',
    href: OPS_HREF,
    icon: ShieldCheck,
    exact: false,
    group: 'primary',
    roles: [OPS_ROLE_TYPE],
  },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.group === 'primary');
