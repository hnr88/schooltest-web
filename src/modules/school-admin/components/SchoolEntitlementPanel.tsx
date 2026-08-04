'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Badge,
  DataPanel,
  KeyValueList,
  KeyValueRow,
  ProgressBar,
} from '@/modules/design-system';
import { AllowanceRow } from '@/modules/school-admin/components/AllowanceRow';
import {
  isSeatCapReached,
  usagePercent,
} from '@/modules/school-admin/lib/entitlement-view';
import type { Entitlement } from '@/modules/school-admin/types/school-admin.types';

import type { SchoolEntitlementPanelProps } from '@/modules/school-admin/types/components.types';

// Dumb panel for C-ENT-01: seats usage, plan code, renewal date and one row
// per Progress Test allowance. The seat-cap message appears only when the
// school has no seats left (spec section 7).
export function SchoolEntitlementPanel({ entitlement }: SchoolEntitlementPanelProps) {
  const t = useTranslations('SchoolAdmin.entitlement');

  return (
    <DataPanel
      data-slot="school-entitlement-panel"
      className="flex flex-col gap-6 p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('seatsExplainer')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-foreground">{t('seatsLabel')}</span>
          <span className="text-sm font-semibold text-foreground">
            {t('seatsUsed', {
              used: entitlement.seats_used,
              total: entitlement.seats_total,
            })}
          </span>
        </div>
        <ProgressBar
          value={usagePercent(entitlement.seats_used, entitlement.seats_total)}
          ariaLabel={t('seatsLabel')}
        />
        <p className="text-sm text-body">
          {t('seatsRemaining', { count: entitlement.seats_remaining })}
        </p>
        {isSeatCapReached(entitlement.seats_remaining) ? (
          <Alert variant="warning" title={t('seatCapTitle')}>
            {t('seatCapReached')}
          </Alert>
        ) : null}
      </div>

      <KeyValueList>
        <KeyValueRow label={t('planLabel')}>
          <Badge variant="accent">{entitlement.plan_code}</Badge>
        </KeyValueRow>
        <KeyValueRow label={t('renewalLabel')}>
          {entitlement.renewal_date
            ? format(new Date(entitlement.renewal_date), 'd MMM yyyy')
            : t('renewalNotSet')}
        </KeyValueRow>
      </KeyValueList>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t('allowanceTitle')}</h3>
        <ul className="flex flex-col gap-4">
          {entitlement.allowances.map((allowance) => (
            <AllowanceRow key={allowance.test_type} allowance={allowance} />
          ))}
        </ul>
      </div>
    </DataPanel>
  );
}
