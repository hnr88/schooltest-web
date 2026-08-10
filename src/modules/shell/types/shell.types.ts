import type { LucideIcon } from 'lucide-react';

export type NavLabelKey =
  | 'overview'
  | 'myChildren'
  | 'reports'
  | 'notifications'
  | 'search'
  | 'settings'
  | 'teacherDashboard'
  | 'testSessions'
  | 'results';

// Two rail groupings, one per persona (.qa/DECISIONS.md A4: ONE shell, role
// filtered — never a second sidebar). `primary` is the parent/admin rail the app
// already shipped; `teach` is the teacher's Dashboard · Test sessions · Results.
// A group with no visible item renders nothing at all, so no account ever sees an
// empty section heading.
export type NavGroup = 'primary' | 'teach';

// The `Shell.sidebar.groups.*` catalog key a group's overline renders.
export type NavGroupLabelKey = 'manage' | 'teach';

// The `Shell.userMenu.roles.*` catalog key the rail's user card renders.
export type UserRoleLabelKey = 'parent' | 'teacher' | 'admin' | 'student';

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
  // The inverse gate: visible to everyone EXCEPT these role slugs. The teacher's
  // rail is exactly three items, so the parent destinations are subtracted rather
  // than re-allow-listed for every other role (A4).
  hiddenForRoles?: readonly string[];
}

export interface NavSection {
  group: NavGroup;
  labelKey: NavGroupLabelKey;
  items: readonly NavItem[];
}
