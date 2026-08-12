import { OPS_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth';

// A4: a teacher is NOT redirected off /dashboard any more — that route IS their
// Dashboard, and the page branches in place. Only sections with their own root
// (school admin, ops) are listed here.
export const ROLE_DESTINATIONS: Record<string, string> = {
  [SCHOOL_ADMIN_ROLE_TYPE]: '/dashboard/school',
  [OPS_ROLE_TYPE]: '/dashboard/ops',
};

export const DASHBOARD_SEARCH_LISTBOX_ID = 'dashboard-search-listbox';
