'use client';

import { useTranslations } from 'next-intl';

import { ProgressBar } from '@/modules/design-system';
import { usagePercent } from '@/modules/school-admin/lib/entitlement-view';
import type { Allowance } from '@/modules/school-admin/types/school-admin.types';

// One Progress Test type: remaining count is the headline, used/total the
// detail. Type names stay plain (Reading, Listening, Writing, Speaking).
export function AllowanceRow({ allowance }: { allowance: Allowance }) {
  const t = useTranslations('SchoolAdmin.entitlement');
  const name = t(`testType.${allowance.test_type}`);

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="text-sm font-semibold text-foreground">
          {t('allowanceRemaining', { count: allowance.remaining })}
        </span>
      </div>
      <ProgressBar
        value={usagePercent(allowance.used, allowance.total)}
        ariaLabel={name}
      />
      <span className="text-xs text-body">
        {t('allowanceUsed', { used: allowance.used, total: allowance.total })}
      </span>
    </li>
  );
}
