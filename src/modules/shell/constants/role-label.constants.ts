import {
  OPS_ROLE_TYPE,
  PARENT_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth';

// Role slugs the sidebar user card renders a label for (Shell.userMenu.roles.*).
export const LABELLED_ROLE_TYPES = [
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
  OPS_ROLE_TYPE,
  PARENT_ROLE_TYPE,
];
