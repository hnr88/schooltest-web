import { OPS_SUPPORT_ROLE_TYPE } from '@schooltest/ops-contracts';

import { OPS_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE } from '@/modules/auth';

// Each sectioned persona is redirected off /dashboard to its own root: school
// admin, ops, and — since task 10 retired the two superseded teacher
// dashboards (R-01/R-16) — the teacher, whose home surface is the class list
// at /dashboard/results. Every other role renders the parent Overview here.
// OPS-075: `ops_support` signs in to the SAME portal as `ops` — the nav rail
// admits it through the shared `isOpsPortalRole` guard (nav.constants.ts), so
// the post-login redirect must land it on /dashboard/ops too, not strand it
// on the parent overview.
export const ROLE_DESTINATIONS: Record<string, string> = {
  [SCHOOL_ADMIN_ROLE_TYPE]: '/dashboard/school',
  [OPS_ROLE_TYPE]: '/dashboard/ops',
  [OPS_SUPPORT_ROLE_TYPE]: '/dashboard/ops',
  [TEACHER_ROLE_TYPE]: '/dashboard/results',
};

export const DASHBOARD_SEARCH_LISTBOX_ID = 'dashboard-search-listbox';
