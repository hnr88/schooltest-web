import {
  BarChart3,
  Clock,
  LayoutDashboard,
  LayoutGrid,
  School,
  Search,
  Settings,
  SlidersHorizontal,
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
// the page branches on role and every role but teacher has its own home here.
// These SUPERSEDE the older '/dashboard/teach' rail entry — the route itself
// survives, it simply leaves the rail.
export const TEACHER_DASHBOARD_HREF = '/dashboard';
export const TEST_SESSIONS_HREF = '/dashboard/test-sessions';
export const RESULTS_HREF = '/dashboard/results';

// Teacher-only report surface (E11-01). Its rail entry retired (R-11, teacher
// task 03 — the design's two-entry rail carries no Reports destination), the
// const stays for its four live consumers (MasteryTable, StudentMasteryDrilldown,
// the retired teacher home's own constants, shell/index.ts) and the retained
// /dashboard/reports route.
export const REPORTS_HREF = '/dashboard/reports';

// School-staff settings (notifications/06, D-08). The user menu's Settings item
// sends teacher and school_admin HERE instead of /dashboard/settings: that route
// is the parent portal's, behind ParentGuard + the parent-views mask, while
// GET/PUT /api/notification-preferences/me is granted to every role and gates
// the events staff actually receive. NOT a rail entry — the teacher rail stays
// the design's two entries (R-10/D-33) and the school admin's Account tile is
// row school-admin/24's — so this const has exactly one consumer, UserMenu.
export const STAFF_SETTINGS_HREF = '/dashboard/teach/settings';

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
//
// The rail itself is the design's TWO entries (Ops Portal.dc.html:25-47):
// Schools under Operations and Settings under Account. The five console
// entries (timers/system/audit/comms/flags) left the rail here — R-01…R-06 —
// and their routes keep serving until task 41 retires the screens (R-09…R-14).
export const OPS_HREF = '/dashboard/ops';

export const OPS_SCHOOLS_HREF = `${OPS_HREF}/schools`;
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
    // The design's Account entry (Ops Portal.dc.html:34-39): group 'account'
    // pins it to the sidebar footer beside the school admin's Account. The
    // footer renders a Separator rather than an "Account" overline, and keeping
    // that shared rendering is D-42's deliberate label fidelity departure.
    labelKey: 'opsSettings',
    href: OPS_SETTINGS_HREF,
    icon: SlidersHorizontal,
    exact: false,
    group: 'account',
    roles: [OPS_ROLE_TYPE],
  },
  {
    // The design's two-entry rail (Teacher Portal v2.dc.html:29–35): Classes
    // (the results surface) ahead of Live sessions (test sessions), under the
    // TEACHER VIEW overline. R-10 retired the teacherDashboard entry — the
    // /dashboard route and TEACHER_DASHBOARD_HREF keep serving the other roles.
    // Strings stay (D-33): "Results" and "Test sessions" keep their keys; only
    // the order and the design's icons — the 2×2 grid at :30 and the clock at
    // :33 — changed.
    labelKey: 'results',
    href: RESULTS_HREF,
    icon: LayoutGrid,
    exact: false,
    group: 'teach',
    roles: [TEACHER_ROLE_TYPE],
  },
  {
    labelKey: 'testSessions',
    href: TEST_SESSIONS_HREF,
    icon: Clock,
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
// is what dropped the teacher's 'teach' entries before render (B3, fixed
// identically here and in upstream 5c0841e).
export const NAV_GROUP_ORDER: readonly NavGroup[] = ['primary', 'teach'];

export const NAV_GROUP_LABEL_KEYS: Record<NavGroup, NavGroupLabelKey> = {
  primary: 'manage',
  // Teacher Portal v2.dc.html:27 — the design's TEACHER VIEW overline. The old
  // `teach` key stays in every catalogue (D-33: no i18n key is deleted); the
  // teach group is teacher-only, so no other role ever reads the new word.
  teach: 'teacherView',
  account: 'manage',
};
