import type { BadgeProps } from '@/modules/design-system';
import type {
  SchoolAccountStatus,
  SchoolOnboardingStatus,
} from '@/modules/school-admin/types/school-admin.types';

import type { BadgeVariant } from '@/modules/school-admin/types/lib.types';

// Lifecycle enums -> chip colour. Green only for states a school would read as
// good news; suspended/closed stay loud because they block usage.
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
