import type { NavLabelKey } from '@/modules/shell/types/shell.types';

interface ShellRouteMeta {
  labelKey: NavLabelKey;
}

const CHILDREN_PATH = '/dashboard/children';
const NOTIFICATIONS_PATH = '/dashboard/notifications';
const SEARCH_PATH = '/dashboard/search';
const SETTINGS_PATH = '/dashboard/settings';

export function getShellRouteMeta(pathname: string): ShellRouteMeta {
  if (pathname.startsWith(CHILDREN_PATH)) return { labelKey: 'myChildren' };
  if (pathname.startsWith(NOTIFICATIONS_PATH)) return { labelKey: 'notifications' };
  if (pathname.startsWith(SEARCH_PATH)) return { labelKey: 'search' };
  if (pathname.startsWith(SETTINGS_PATH)) return { labelKey: 'settings' };
  return { labelKey: 'overview' };
}
