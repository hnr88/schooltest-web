import type { JSX } from 'react';

import { AccountOverviewPanel } from '@/modules/school-admin/components/AccountOverviewPanel';
import { AccountSettingsPanel } from '@/modules/school-admin/components/AccountSettingsPanel';
import { AccountSignOutPanel } from '@/modules/school-admin/components/AccountSignOutPanel';
import type { AccountTab } from '@/modules/school-admin/types/account.types';

export const ACCOUNT_PANELS: Record<AccountTab, () => JSX.Element> = {
  account: AccountOverviewPanel,
  settings: AccountSettingsPanel,
  signout: AccountSignOutPanel,
};
