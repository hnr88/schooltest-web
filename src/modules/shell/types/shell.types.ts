import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

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
  | 'opsSettings'
  | 'testSessions'
  | 'results';

// ONE shell, role filtered — never a second sidebar (.qa/DECISIONS.md A4).
// `primary` is the destination list under the "Manage" overline (parent, school
// admin and ops all render here, role-scoped); `teach` is the teacher's two-entry
// rail — Results (Classes) · Test sessions (Live sessions), Teacher Portal
// v2.dc.html:29–35; `account` is the single pinned-bottom entry the redesign
// spec places behind a divider (spec §Sidebar Navigation).
// A group with no visible item renders nothing, so no account ever sees a bare
// overline.
export type NavGroup = 'primary' | 'teach' | 'account';

// The `Shell.sidebar.groups.*` catalog key a group's overline renders.
// `teacherView` is the design's TEACHER VIEW overline (:27); `teach` stays a
// valid member — no i18n key is deleted (D-33) — it is simply no longer mapped.
export type NavGroupLabelKey = 'manage' | 'teach' | 'teacherView';

// The `Shell.userMenu.roles.*` catalog key the rail's user card renders.
export type UserRoleLabelKey = 'parent' | 'teacher' | 'admin' | 'student';

export interface ShellRouteMeta {
  labelKey: NavLabelKey;
  href: string;
}

export interface RecordCrumbProps {
  label: string;
  /** Names for record segments above this one, keyed by href. */
  ancestors?: Readonly<Record<string, string>>;
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
  // The inverse gate: visible to everyone EXCEPT these role slugs. Kept
  // alongside `roles` because the two express different intents — an allow-list
  // for a role-owned section, a subtraction for a shared destination one role
  // must not see. `filterNavByRole` withholds BOTH until the role resolves.
  hiddenForRoles?: readonly string[];
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

export interface NavSection {
  group: NavGroup;
  labelKey: NavGroupLabelKey;
  items: readonly NavItem[];
}

export interface SidebarNavItemProps {
  item: NavItem;
  label: string;
  isActive: boolean;
  onNavigate: () => void;
  /**
   * teacher/06 — an optional trailing node rendered at the item's far edge
   * (the design's pulsing live dot on the Live-sessions entry, `:34`). Pure
   * presentation: the data behind it stays with the caller.
   */
  trailing?: ReactNode;
  skin?: ShellSkin;
}

// Which frame the shell chrome paints. 'teacher' is Teacher Portal v2 (the bordered
// rail, no topbar); every other role keeps 'default'.
export type ShellSkin = 'default' | 'teacher';

export interface UserMenuSkinClasses {
  card: string;
  avatar: string;
  text: string;
  name: string;
  role: string;
  content: string;
  signOut?: string;
}

export interface RecordCrumbState {
  label: string | null;
  /** Names for record segments ABOVE the trailing one, keyed by href. */
  ancestors: Readonly<Record<string, string>>;
  pathname: string | null;
  setRecordCrumb: (
    pathname: string,
    label: string,
    ancestors?: Readonly<Record<string, string>>,
  ) => void;
  clearRecordCrumb: (pathname: string) => void;
}
