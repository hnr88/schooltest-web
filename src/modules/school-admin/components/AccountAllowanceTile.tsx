'use client';

import { useTranslations } from 'next-intl';

import { TintTile } from '@/modules/design-system';
import { allowanceTone } from '@/modules/school-admin/lib/account-view';
import type { AccountAllowanceTileProps } from '@/modules/school-admin/types/account.types';

// One tile of the allowance grid (School Admin Portal.dc.html:870-875):
// stacked — skill at 14/600, the remaining count beneath — in a 16-radius
// bordered tile, 18px 20px. The artboard's two states: the granted type on
// the mint tint with teal sub-ink, the exhausted types on the neutral
// recess with the disabled slate ink. The remaining count is C-ENT-01's,
// computed server-side at read; the tone follows it.
export function AccountAllowanceTile({ allowance }: AccountAllowanceTileProps) {
  const t = useTranslations('SchoolAdmin.entitlement');
  const granted = allowanceTone(allowance.remaining) === 'accent';

  return (
    <TintTile
      tone={allowanceTone(allowance.remaining)}
      className={`flex flex-col gap-1.5 rounded-panel border px-5 py-4.5 ${
        granted ? 'border-teal-100' : 'border-border'
      }`}
    >
      <span
        className={`text-body-md font-semibold ${granted ? 'text-foreground' : 'text-slate-400'}`}
      >
        {t(`testType.${allowance.test_type}`)}
      </span>
      <span
        className={`text-caption ${granted ? 'text-teal-700' : 'text-slate-400'}`}
      >
        {t('allowanceRemaining', { count: allowance.remaining })}
      </span>
    </TintTile>
  );
}
