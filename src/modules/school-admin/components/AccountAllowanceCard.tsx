'use client';

import { useTranslations } from 'next-intl';

import { DataPanel, PanelHeaderRow } from '@/modules/design-system';
import { AccountAllowanceTile } from '@/modules/school-admin/components/AccountAllowanceTile';
import type { AccountAllowanceCardProps } from '@/modules/school-admin/types/account.types';

// Spec section 5 "Test allowance card": a 2x2 grid, one tile per test type, in
// the order C-ENT-01 returns them.
export function AccountAllowanceCard({ allowances }: AccountAllowanceCardProps) {
  const t = useTranslations('SchoolAdmin.account');

  return (
    <DataPanel data-slot="account-allowance-card" className="flex flex-col gap-4 p-6">
      <PanelHeaderRow as="h2" title={t('allowanceTitle')} />
      <div className="grid grid-cols-2 gap-3">
        {allowances.map((allowance) => (
          <AccountAllowanceTile key={allowance.test_type} allowance={allowance} />
        ))}
      </div>
    </DataPanel>
  );
}
