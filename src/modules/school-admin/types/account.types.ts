import type { ACCOUNT_TABS } from '@/modules/school-admin/constants/account.constants';
import type {
  Allowance,
  Entitlement,
  SchoolAnalyticsSummary,
  SchoolMe,
} from '@/modules/school-admin/types/school-admin.types';

export type AccountTab = (typeof ACCOUNT_TABS)[number];

export interface AccountDetailsCardProps {
  school: SchoolMe;
  adminEmail: string | null;
}

// `analytics` is null while the C-RPT-06 read has not produced a payload, so
// the seat tile renders the no-value dash instead of an unloaded figure.
export interface AccountPlanCardProps {
  entitlement: Entitlement;
  analytics: SchoolAnalyticsSummary | null;
}

export interface AccountAllowanceCardProps {
  allowances: readonly Allowance[];
}

export interface AccountAllowanceTileProps {
  allowance: Allowance;
}
