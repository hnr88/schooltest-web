import type { JSX } from 'react';

import { AccountDetailsPanel } from '@/modules/school-admin/components/AccountDetailsPanel';
import { AccountEntitlementSection } from '@/modules/school-admin/components/AccountEntitlementSection';
import { AccountSettingsPanel } from '@/modules/school-admin/components/AccountSettingsPanel';
import { AccountSignOutPanel } from '@/modules/school-admin/components/AccountSignOutPanel';
import type { AccountTab } from '@/modules/school-admin/types/account.types';

export const ACCOUNT_PANELS: Record<AccountTab, () => JSX.Element> = {
  details: AccountDetailsPanel,
  plan: AccountEntitlementSection,
  settings: AccountSettingsPanel,
  signout: AccountSignOutPanel,
};
