import type { ShellRouteMeta } from '@/modules/shell/types/shell.types';

const CHILDREN_PATH = '/dashboard/children';
const REPORTS_PATH = '/dashboard/reports';
const NOTIFICATIONS_PATH = '/dashboard/notifications';
const SEARCH_PATH = '/dashboard/search';
const SETTINGS_PATH = '/dashboard/settings';
const DASHBOARD_PATH = '/dashboard';

// Section-level meta for the topbar trail. `href` lets the section crumb become a
// LINK once a page appends a record crumb after it (Dashboard / My children /
// Emma Hansen) — without it the trail would dead-end at the section and the
// record would need a second breadcrumb inside <main>, which canonical never has.
export function getShellRouteMeta(pathname: string): ShellRouteMeta {
  if (pathname.startsWith(CHILDREN_PATH)) return { labelKey: 'myChildren', href: CHILDREN_PATH };
  if (pathname.startsWith(REPORTS_PATH)) return { labelKey: 'reports', href: REPORTS_PATH };
  if (pathname.startsWith(NOTIFICATIONS_PATH)) {
    return { labelKey: 'notifications', href: NOTIFICATIONS_PATH };
  }
  if (pathname.startsWith(SEARCH_PATH)) return { labelKey: 'search', href: SEARCH_PATH };
  if (pathname.startsWith(SETTINGS_PATH)) return { labelKey: 'settings', href: SETTINGS_PATH };
  return { labelKey: 'overview', href: DASHBOARD_PATH };
}
