import type { LucideIcon } from 'lucide-react';

export type NavLabelKey =
  | 'overview'
  | 'myChildren'
  | 'reports'
  | 'notifications'
  | 'search'
  | 'settings'
  | 'school'
  | 'classes'
  | 'students'
  | 'teachers'
  | 'account'
  | 'teach'
  | 'opsSchools'
  | 'opsPipeline'
  | 'opsTimers'
  | 'opsTools'
  | 'opsSettings';

// Rail grouping. `primary` is the main destination list under the "Manage"
// overline; `account` is the single pinned-bottom entry the spec places behind
// a divider (spec §Sidebar Navigation).
export type NavGroup = 'primary' | 'account';

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
  // Task 46 (st-mvp-pivot): the destination lives in the parent portal, which is
  // masked while PARENT_VIEWS_ENABLED is off. nav-visible drops these items for
  // every role until the flag flips on; nothing is deleted.
  //
  // ORTHOGONAL to `roles`, and neither may stand in for the other: a parent-portal
  // entry carries BOTH, so the flag decides whether the portal exists yet and the
  // role decides whose rail it belongs on. Flag off => hidden from everyone; flag
  // on => visible to parents ONLY (never to a school admin, whose rail the redesign
  // spec fixes at School/Classes/Teachers/Students + Account).
  parentViews?: boolean;
}

export interface SidebarNavItemProps {
  item: NavItem;
  label: string;
  isActive: boolean;
  onNavigate: () => void;
}

export interface RecordCrumbState {
  label: string | null;
  pathname: string | null;
  setRecordCrumb: (pathname: string, label: string) => void;
  clearRecordCrumb: (pathname: string) => void;
}
