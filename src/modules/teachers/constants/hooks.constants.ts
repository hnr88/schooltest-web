import type { StaffRowStatus } from '@/modules/teachers/types/teachers.types';

export const STATUS_ORDER: Record<StaffRowStatus, number> = {
  invited: 0,
  expired: 1,
  active: 2,
  deactivated: 3,
};
