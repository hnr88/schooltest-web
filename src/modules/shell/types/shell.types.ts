import type { LucideIcon } from 'lucide-react';

export type NavLabelKey =
  'overview' | 'myChildren' | 'reports' | 'notifications' | 'search' | 'settings';

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
  // Absent = visible to every signed-in account. Present = visible only to those
  // users-permissions role slugs, because the destination's API answers 403 to
  // everyone else (F-WEB-TEACHER-REPORT).
  roles?: readonly string[];
}
