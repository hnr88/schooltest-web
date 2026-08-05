import { ACCOUNT_TABS } from '@/modules/school-admin/constants/account.constants';
import type { AccountTab } from '@/modules/school-admin/types/account.types';

export function isAccountTab(value: string): value is AccountTab {
  return ACCOUNT_TABS.some((tab) => tab === value);
}
