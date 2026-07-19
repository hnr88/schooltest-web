import { LayoutDashboard, Search, Settings, UserSearch, Users } from 'lucide-react';

import type { NavItem } from '@/modules/shell/types/shell.types';

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { labelKey: 'myChildren', href: '/dashboard/children', icon: Users, exact: false },
  { labelKey: 'schoolSearch', href: '/dashboard/search/schools', icon: Search, exact: false },
  { labelKey: 'agentSearch', href: '/dashboard/search/agents', icon: UserSearch, exact: false },
  { labelKey: 'settings', href: '/dashboard/settings', icon: Settings, exact: false },
];
