'use client';

import { CircleAlertIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { PLAN_SUBTITLE_KEYS } from '@/modules/school-admin/constants/account.constants';
import type { AccountPlanCardProps } from '@/modules/school-admin/types/account.types';

// VIEW 6 "Plan" tab (School Admin Portal.dc.html:846-865 + state :1755-1762):
// the NAVY HERO — 24-radius #0E2350 band with the glass disc bled off the top
// right corner, the plan overline/name/note on the left and "Seats used" on
// the right, plus the design's in-hero cap banner (rgba(255,255,255,.1),
// driven by the SAME payload's seats_remaining === 0). "Seats used" binds the
// C-ENT-01 LICENSING pair — seats_used / seats_total, the cap the API enforces
// on student create — the same pair the cap banner keys on, so the tile and
// the banner can never disagree. It deliberately does NOT render C-RPT-06's
// students_with_sitting / students_total participation pair (task 016
// rejection). Below the hero, the full-licence line keeps the upgrade contact
// the spec requires — text, never a self-serve button.
export function AccountPlanCard({ entitlement }: AccountPlanCardProps) {
  const t = useTranslations('SchoolAdmin');
  const subtitleKey = PLAN_SUBTITLE_KEYS[entitlement.plan];
  const renewal =
    entitlement.renewal_date === null
      ? t('entitlement.renewalNotSet')
      : format(new Date(entitlement.renewal_date), 'd MMM yyyy');
  const note = [
    subtitleKey === null ? null : t(subtitleKey),
    `${t('entitlement.renewalLabel')}: ${renewal}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section data-slot="account-plan-card" className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-card bg-navy-900 p-7 px-7.5 text-white">
        <span
          aria-hidden="true"
          className="absolute -top-20 -right-17.5 size-60 rounded-full bg-surface-glass-soft"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-meta font-semibold uppercase tracking-overline text-navy-muted">
              {t('account.currentPlanLabel')}
            </div>
            <div className="mt-2.5 text-portal-heading font-bold">
              {t(`account.plan.${entitlement.plan}`)}
            </div>
            <div className="mt-1.5 text-body-sm text-navy-muted">{note}</div>
          </div>
          <div className="text-right">
            <div className="text-meta text-navy-muted">{t('account.seatsUsedLabel')}</div>
            <div className="mt-1.5 text-portal-kpi font-bold tabular-nums">
              {t('account.seatsValue', {
                used: entitlement.seats_used,
                total: entitlement.seats_total,
              })}
            </div>
          </div>
        </div>
        {entitlement.seats_remaining === 0 ? (
          <div className="relative mt-5.5 flex items-center gap-2.75 rounded-xl bg-surface-glass px-4 py-3.25 text-body-sm text-danger-soft-2">
            <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.2} />
            <span>
              {t('entitlement.seatCapTitle')} — {t('entitlement.seatCapReached')}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-card p-6 px-7.5 shadow-sm">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-sm font-semibold text-foreground">
            {t('account.fullLicenseLabel')}
          </span>
          <span className="text-meta text-muted-foreground">
            {t('account.fullLicenseDescription')}
          </span>
        </div>
        <span className="shrink-0 text-body-sm font-semibold text-foreground">
          {t('account.fullLicenseContact')}
        </span>
      </div>
    </section>
  );
}
