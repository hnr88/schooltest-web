'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

// GAP-6 — the design-drawn SESSION EXPIRED wall (Ops Portal.dc.html 792–803):
// the operator sees WHY their screen stopped responding instead of being
// yanked to /sign-in. The guarded tree stays mounted beneath this card, so
// nothing visible is torn down while the operator decides.
export function OpsSessionExpiredCard() {
  const t = useTranslations('Auth');

  return (
    <div
      data-slot="ops-session-expired"
      role="alertdialog"
      aria-modal="true"
      aria-label={t('sessionExpiredTitle')}
      className="fixed inset-0 z-50 grid place-items-center bg-black/10 p-6 supports-backdrop-filter:backdrop-blur-xs"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-card border border-border bg-card p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-foreground">{t('sessionExpired')}</h2>
        <p className="text-sm text-body">{t('sessionExpiredBody')}</p>
        <div>
          <Button type="button" href="/sign-in">
            {t('sessionExpiredAction')}
          </Button>
        </div>
      </div>
    </div>
  );
}
