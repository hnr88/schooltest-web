import { OPS_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE } from '@/modules/auth';

// Each sectioned persona is redirected off /dashboard to its own root: school
// admin, ops, and — since task 10 retired the two superseded teacher
// dashboards (R-01/R-16) — the teacher, whose home surface is the class list
// at /dashboard/results. Every other role renders the parent Overview here.
export const ROLE_DESTINATIONS: Record<string, string> = {
  [SCHOOL_ADMIN_ROLE_TYPE]: '/dashboard/school',
  [OPS_ROLE_TYPE]: '/dashboard/ops',
  [TEACHER_ROLE_TYPE]: '/dashboard/results',
};

export const DASHBOARD_SEARCH_LISTBOX_ID = 'dashboard-search-listbox';
