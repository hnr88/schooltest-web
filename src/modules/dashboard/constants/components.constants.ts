import { OPS_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE } from '@/modules/auth';

export const ROLE_DESTINATIONS: Record<string, string> = {
  [SCHOOL_ADMIN_ROLE_TYPE]: '/dashboard/school',
  [TEACHER_ROLE_TYPE]: '/dashboard/teach',
  [OPS_ROLE_TYPE]: '/dashboard/ops',
};

export const DASHBOARD_SEARCH_LISTBOX_ID = 'dashboard-search-listbox';
