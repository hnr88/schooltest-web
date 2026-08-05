'use client';

import { useTranslations } from 'next-intl';

import { TintTile } from '@/modules/design-system';
import { allowanceTone } from '@/modules/school-admin/lib/account-view';
import type { AccountAllowanceTileProps } from '@/modules/school-admin/types/account.types';

// One test type in the 2x2 allowance grid. The remaining count is C-ENT-01's,
// computed server-side at read; the tile tone follows it.
export function AccountAllowanceTile({ allowance }: AccountAllowanceTileProps) {
  const t = useTranslations('SchoolAdmin.entitlement');

  return (
    <TintTile
      tone={allowanceTone(allowance.remaining)}
      className="flex items-center justify-between gap-3"
    >
      <span className="text-body-sm font-semibold text-foreground">
        {t(`testType.${allowance.test_type}`)}
      </span>
      <span className="shrink-0 text-meta font-semibold">
        {t('allowanceRemaining', { count: allowance.remaining })}
      </span>
    </TintTile>
  );
}
