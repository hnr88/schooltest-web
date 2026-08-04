import type { BadgeVariant } from '@/modules/school-admin/types/lib.types';
import type { SchoolAccountStatus, SchoolOnboardingStatus } from '@/modules/school-admin/types/school-admin.types';

export const ACCOUNT_STATUS_VARIANTS: Record<SchoolAccountStatus, BadgeVariant> = {
  active: 'success',
  invited: 'accent',
  invoiced: 'accent',
  prospect: 'secondary',
  suspended: 'warning',
  closed: 'error',
};

export const ONBOARDING_STATUS_VARIANTS: Record<SchoolOnboardingStatus, BadgeVariant> = {
  complete: 'success',
  submitted: 'accent',
  in_progress: 'accent',
  link_sent: 'secondary',
  not_started: 'secondary',
};
