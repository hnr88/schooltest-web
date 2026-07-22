import type { LucideIcon } from 'lucide-react';

export type NavLabelKey = 'overview' | 'myChildren' | 'notifications' | 'search' | 'settings';

// Canonical rail grouping (DS §12 Navigation card): the primary destinations sit
// above a hairline divider, the account-level ones below it.
export type NavGroup = 'primary' | 'system';

export interface ShellRouteMeta {
  labelKey: NavLabelKey;
  href: string;
}

export interface RecordCrumbProps {
  label: string;
}

export interface NavItem {
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
  exact: boolean;
  group: NavGroup;
}
