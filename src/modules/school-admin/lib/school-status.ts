import type { BadgeProps } from '@/modules/design-system';
import type {
  SchoolAccountStatus,
  SchoolOnboardingStatus,
} from '@/modules/school-admin/types/school-admin.types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

// Lifecycle enums -> chip colour. Green only for states a school would read as
// good news; suspended/closed stay loud because they block usage.
export const ACCOUNT_STATUS_VARIANTS: Record<SchoolAccountStatus, BadgeVariant> = {
  active: 'success',
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
