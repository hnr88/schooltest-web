import type { ACCOUNT_TABS } from '@/modules/school-admin/constants/account.constants';
import type {
  Allowance,
  Entitlement,
  SchoolMe,
} from '@/modules/school-admin/types/school-admin.types';

export type AccountTab = (typeof ACCOUNT_TABS)[number];

export interface AccountDetailsCardProps {
  school: SchoolMe;
  adminEmail: string | null;
}

export interface AccountPlanCardProps {
  entitlement: Entitlement;
}

export interface AccountAllowanceCardProps {
  allowances: readonly Allowance[];
}

export interface AccountAllowanceTileProps {
  allowance: Allowance;
}
