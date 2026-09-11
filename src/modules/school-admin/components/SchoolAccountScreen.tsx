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

// VIEW 6, Account (School Admin Portal.dc.html:821-902): a single 900px
// column — the design's one narrow measure on this view — carrying the page
// title, the tab row and the active panel, all on the view's 20px rhythm.
// The "Dashboard / Account" trail is the shared topbar breadcrumb.
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
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex max-w-4xl flex-col gap-5">
        <div>
          <h1 className="text-portal-title font-medium text-foreground">{t('account.title')}</h1>
          <p className="mt-1.75 text-body-md text-muted-foreground">{t('account.subtitle')}</p>
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
          className="flex flex-col gap-4.5"
        >
          <Panel />
        </div>
      </div>
    </main>
  );
}
