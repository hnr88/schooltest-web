import { FileChartColumn, LayoutDashboard, Search, Settings, Users } from 'lucide-react';

import { TEACHER_ROLE_TYPE } from '@/modules/auth';
import type { NavItem } from '@/modules/shell/types/shell.types';

// The one reachable search surface (unified search). The topbar trigger pill points
// here — no invented route, no dead control.
export const SEARCH_HREF = '/dashboard/search';

// Teacher-only report surface (E11-01). Role-scoped rather than unconditional:
// C-11/C-4 answer 403 to a parent, so an always-visible entry would be a dead link.
export const REPORTS_HREF = '/dashboard/reports';

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
    group: 'system',
  },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.group === 'primary');
export const SYSTEM_NAV_ITEMS = NAV_ITEMS.filter((item) => item.group === 'system');
