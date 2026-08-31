'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { UnderlineTabs } from '@/modules/design-system';
import { ACCOUNT_PANELS } from '@/modules/school-admin/constants/account-components.constants';
import {
  ACCOUNT_TAB_CONFIG,
  ACCOUNT_TABS_IDLE_INK,
} from '@/modules/school-admin/constants/account.constants';
import { isAccountTab } from '@/modules/school-admin/lib/account-tab';
import type { AccountTab } from '@/modules/school-admin/types/account.types';

// Spec section 5 "Account": the school's own plan, seats and test allowances
// behind three sub-tabs. Page shell matches the rest of /dashboard/school; the
// "Dashboard / Account" trail is the shared topbar breadcrumb.
export function SchoolAccountScreen() {
  const t = useTranslations('SchoolAdmin');
  const [tab, setTab] = useState<AccountTab>('details');
  const Panel = ACCOUNT_PANELS[tab];
  const options = ACCOUNT_TAB_CONFIG.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));

  return (
    <main
      data-slot="school-account"
      data-surface="school-admin-account"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('account.title')}</h1>
        <p className="text-sm text-body">{t('account.subtitle')}</p>
      </div>
      <UnderlineTabs
        options={options}
        value={tab}
        onValueChange={(next) => {
          if (isAccountTab(next)) setTab(next);
        }}
        ariaLabel={t('account.tabsLabel')}
        className={ACCOUNT_TABS_IDLE_INK}
      />
      <div
        key={tab}
        role="tabpanel"
        aria-label={t(`account.tabs.${tab}`)}
        className="flex flex-col gap-4"
      >
        <Panel />
      </div>
    </main>
  );
}
