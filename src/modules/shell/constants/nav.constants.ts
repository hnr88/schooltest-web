import { LayoutDashboard, Search, Settings, Users } from 'lucide-react';

import type { NavItem } from '@/modules/shell/types/shell.types';

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { labelKey: 'myChildren', href: '/dashboard/children', icon: Users, exact: false },
  { labelKey: 'search', href: '/dashboard/search', icon: Search, exact: false },
  { labelKey: 'settings', href: '/dashboard/settings', icon: Settings, exact: false },
];
