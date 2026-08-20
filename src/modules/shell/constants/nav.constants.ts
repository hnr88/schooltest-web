import {
  BarChart3,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  LayoutGrid,
  School,
  Search,
  Settings,
  SlidersHorizontal,
  SquareCheckBig,
  Timer,
  User,
  Users,
} from 'lucide-react';

import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import {
  OPS_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth/constants/role.constants';
import type {
  NavGroup,
  NavGroupLabelKey,
  NavItem,
} from '@/modules/shell/types/shell.types';

// The one reachable search surface (unified search). The topbar trigger pill points
// here — no invented route, no dead control.
export const SEARCH_HREF = '/dashboard/search';

// The teacher section (.qa/DECISIONS.md A4). `/dashboard` serves two personas:
// the rail's teacher Dashboard entry points here and the page branches on role.
// These SUPERSEDE the older '/dashboard/teach' rail entry, which the brief caps
// out — the route itself survives, it simply leaves the rail.
export const TEACHER_DASHBOARD_HREF = '/dashboard';
export const TEST_SESSIONS_HREF = '/dashboard/test-sessions';
export const RESULTS_HREF = '/dashboard/results';

// Teacher-only report surface (E11-01). Role-scoped rather than unconditional:
// C-11/C-4 answer 403 to a parent, so an always-visible entry would be a dead link.
export const REPORTS_HREF = '/dashboard/reports';

// School admin home (task 27 builds the page; the school-scoped API routes
// answer 403 to every other role, so the whole section is role-scoped).
export const SCHOOL_HREF = '/dashboard/school';

// School admin destinations (spec §Sidebar Navigation): School / Classes /
// Teachers / Students, with Account pinned to the bottom behind a divider.
export const STUDENTS_HREF = `${SCHOOL_HREF}/students`;
export const ACCOUNT_HREF = `${SCHOOL_HREF}/account`;

// Ops console section root (task 66; the /api/ops routes answer 403 to every
// non-ops role, so every entry below is role-scoped like the school admin ones).
// The root itself is NOT a rail destination: /dashboard/ops only redirects to
// /dashboard/ops/schools, and an `exact: false` entry on it would read active on
// every child route alongside the real one.
export const OPS_HREF = '/dashboard/ops';

export const OPS_SCHOOLS_HREF = `${OPS_HREF}/schools`;
export const OPS_TIMERS_HREF = `${OPS_HREF}/timers`;
export const OPS_SETTINGS_HREF = `${OPS_HREF}/settings`;

export const NAV_ITEMS: readonly NavItem[] = [
  {
    labelKey: 'overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
    group: 'primary',
    roles: [PARENT_ROLE_TYPE],
    parentViews: true,
  },
  {
    labelKey: 'myChildren',
    href: '/dashboard/children',
    icon: Users,
    exact: false,
    group: 'primary',
    roles: [PARENT_ROLE_TYPE],
    parentViews: true,
  },
  {
    labelKey: 'reports',
    href: REPORTS_HREF,
    icon: FileChartColumn,
    exact: false,
    group: 'primary',
    roles: [TEACHER_ROLE_TYPE],
  },
  {
    labelKey: 'search',
    href: SEARCH_HREF,
    icon: Search,
    exact: false,
    group: 'primary',
    roles: [PARENT_ROLE_TYPE],
    parentViews: true,
  },
  {
    labelKey: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
    exact: false,
    group: 'primary',
    roles: [PARENT_ROLE_TYPE],
    parentViews: true,
  },
  {
    labelKey: 'school',
    href: SCHOOL_HREF,
    icon: BarChart3,
    exact: true,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'classes',
    href: '/dashboard/school/classes',
    icon: LayoutGrid,
    exact: false,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'teachers',
    href: '/dashboard/school/teachers',
    icon: Users,
    exact: false,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'students',
    href: STUDENTS_HREF,
    icon: User,
    exact: false,
    group: 'primary',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    // Pinned to the bottom of the rail behind a divider (spec §Sidebar
    // Navigation) — rendered from ACCOUNT_NAV_ITEMS in the sidebar footer, not
    // in the primary list.
    labelKey: 'account',
    href: ACCOUNT_HREF,
    icon: Settings,
    exact: false,
    group: 'account',
    roles: [SCHOOL_ADMIN_ROLE_TYPE],
  },
  {
    labelKey: 'opsSchools',
    href: OPS_SCHOOLS_HREF,
    icon: School,
    exact: false,
    group: 'primary',
    roles: [OPS_ROLE_TYPE],
  },
  {
    labelKey: 'opsTimers',
    href: OPS_TIMERS_HREF,
    icon: Timer,
    exact: false,
    group: 'primary',
    roles: [OPS_ROLE_TYPE],
  },
  {
    labelKey: 'opsSettings',
    href: OPS_SETTINGS_HREF,
    icon: SlidersHorizontal,
    exact: false,
    group: 'primary',
    roles: [OPS_ROLE_TYPE],
  },
  {
    labelKey: 'teacherDashboard',
    href: TEACHER_DASHBOARD_HREF,
    icon: LayoutDashboard,
    exact: true,
    group: 'teach',
    roles: [TEACHER_ROLE_TYPE],
  },
  {
    labelKey: 'testSessions',
    href: TEST_SESSIONS_HREF,
    icon: ClipboardList,
    exact: false,
    group: 'teach',
    roles: [TEACHER_ROLE_TYPE],
  },
  {
    labelKey: 'results',
    href: RESULTS_HREF,
    icon: SquareCheckBig,
    exact: false,
    group: 'teach',
    roles: [TEACHER_ROLE_TYPE],
  },
];

// Rendered in the sidebar footer, above the user card and behind a divider.
export const ACCOUNT_NAV_ITEMS = NAV_ITEMS.filter((item) => item.group === 'account');

// Render order of the rail's sections, and the catalog key each overline reads.
// `account` is excluded: it is pinned to the footer via ACCOUNT_NAV_ITEMS, not
// rendered as a section. The rail list itself is the UNFILTERED NAV_ITEMS —
// buildNavSections restricts the render to the groups named here. Pre-filtering
// the list upstream of it (the deleted PRIMARY_NAV_ITEMS, group === 'primary')
// is what dropped the teacher's three 'teach' entries before render (B3, fixed
// identically here and in upstream 5c0841e).
export const NAV_GROUP_ORDER: readonly NavGroup[] = ['primary', 'teach'];

export const NAV_GROUP_LABEL_KEYS: Record<NavGroup, NavGroupLabelKey> = {
  primary: 'manage',
  teach: 'teach',
  account: 'manage',
};
