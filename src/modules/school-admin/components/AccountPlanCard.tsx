'use client';

import { format } from 'date-fns';
import { CalendarDays, Sparkles, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DataPanel, MetricCard, PanelHeaderRow, TintTile } from '@/modules/design-system';
import { PLAN_SUBTITLE_KEYS } from '@/modules/school-admin/constants/account.constants';
import type { AccountPlanCardProps } from '@/modules/school-admin/types/account.types';

// Spec section 5 "Plan and seats card": three metric cards over the full
// licence row. seats_used / seats_total are C-ENT-01's licensing seat cap —
// the figure the API actually enforces — not a second, invented metric.
export function AccountPlanCard({ entitlement }: AccountPlanCardProps) {
  const t = useTranslations('SchoolAdmin');
  const subtitleKey = PLAN_SUBTITLE_KEYS[entitlement.plan];

  return (
    <DataPanel data-slot="account-plan-card" className="flex flex-col gap-4 p-6">
      <PanelHeaderRow as="h2" title={t('account.planTitle')} />
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={Sparkles}
          iconTone="blue"
          label={t('account.currentPlanLabel')}
          value={t(`account.plan.${entitlement.plan}`)}
          delta={subtitleKey === null ? undefined : t(subtitleKey)}
          deltaTone="neutral"
        />
        <MetricCard
          icon={Users}
          iconTone="teal"
          label={t('account.seatsUsedLabel')}
          value={t('account.seatsValue', {
            used: entitlement.seats_used,
            total: entitlement.seats_total,
          })}
        />
        <MetricCard
          icon={CalendarDays}
          iconTone="blue"
          label={t('entitlement.renewalLabel')}
          value={
            entitlement.renewal_date === null
              ? t('entitlement.renewalNotSet')
              : format(new Date(entitlement.renewal_date), 'd MMM yyyy')
          }
        />
      </div>
      <TintTile tone="inset" className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-sm font-semibold text-foreground">
            {t('account.fullLicenseLabel')}
          </span>
          <span className="text-meta">{t('account.fullLicenseDescription')}</span>
        </div>
        <span className="shrink-0 text-meta font-semibold">{t('account.fullLicenseContact')}</span>
      </TintTile>
    </DataPanel>
  );
}
