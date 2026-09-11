'use client';

import { useTranslations } from 'next-intl';

import { DataPanel, PanelHeaderRow } from '@/modules/design-system';
import { AccountAllowanceTile } from '@/modules/school-admin/components/AccountAllowanceTile';
import type { AccountAllowanceCardProps } from '@/modules/school-admin/types/account.types';

// VIEW 6 "Test allowance" card (School Admin Portal.dc.html:866-877): the
// white 24-radius panel with the 2x2 grid of tinted tiles — one per test
// type, in the order C-ENT-01 returns them.
export function AccountAllowanceCard({ allowances }: AccountAllowanceCardProps) {
  const t = useTranslations('SchoolAdmin.account');

  return (
    <DataPanel
      data-slot="account-allowance-card"
      className="flex flex-col rounded-card border-0 px-7.5 py-6.5 shadow-sm"
    >
      <PanelHeaderRow as="h2" title={t('allowanceTitle')} className="pb-0" />
      <div className="mt-4.5 grid grid-cols-2 gap-3.5">
        {allowances.map((allowance) => (
          <AccountAllowanceTile key={allowance.test_type} allowance={allowance} />
        ))}
      </div>
    </DataPanel>
  );
}
