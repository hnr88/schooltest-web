import type { BadgeProps } from '@/modules/design-system';
import type { InviteTeacherValues } from '@/modules/teachers/schemas/invite-teacher.schema';
import type { StaffRowStatus } from '@/modules/teachers/types/teachers.types';

export const DEFAULT_VALUES: InviteTeacherValues = {
  first_name: '',
  last_name: '',
  email: '',
  role: 'teacher',
};

export const STATUS_VARIANTS: Record<StaffRowStatus, BadgeProps['variant']> = {
  active: 'success',
  deactivated: 'error',
  invited: 'accent',
  expired: 'warning',
};
