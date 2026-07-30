import { SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE } from '@/modules/auth';

// After accept the new staff member lands signed in on their own dashboard
// (spec §15): teachers on /dashboard/teach, school admins on /dashboard/school.
// Any other role falls back to /dashboard, whose role gate routes from there.
export function dashboardHrefForRole(role: string): string {
  if (role === TEACHER_ROLE_TYPE) return '/dashboard/teach';
  if (role === SCHOOL_ADMIN_ROLE_TYPE) return '/dashboard/school';
  return '/dashboard';
}
