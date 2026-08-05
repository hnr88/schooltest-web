import type { BadgeProps } from '@/modules/design-system';
import type { InviteTeacherValues } from '@/modules/teachers/schemas/invite-teacher.schema';
import type { SchoolStaffRole, StaffRowStatus } from '@/modules/teachers/types/teachers.types';

export const DEFAULT_VALUES: InviteTeacherValues = {
  first_name: '',
  last_name: '',
  email: '',
};

// The Teachers screen adds TEACHERS, so that is the role its invitations carry.
// The dialog still takes a role prop, so the C-INV-01 school_admin invitation
// stays reachable from any surface that genuinely invites an administrator.
export const DEFAULT_INVITE_ROLE: SchoolStaffRole = 'teacher';

export const STATUS_VARIANTS: Record<StaffRowStatus, BadgeProps['variant']> = {
  active: 'success',
  deactivated: 'error',
  invited: 'accent',
  expired: 'warning',
};
