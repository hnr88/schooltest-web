'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { CAPABILITIES_TRANSLATION_NAMESPACE } from '@/modules/ops/constants/capabilities.constants';

// GAP-6 — the design-drawn SESSION EXPIRED wall (Ops Portal.dc.html 852–862):
// the operator sees WHY their screen stopped responding instead of being
// yanked to /sign-in. The guarded tree stays mounted beneath this card, so
// nothing visible is torn down while the operator decides.
//
// SHARED by OpsGuard and TeacherGuard, so the card is PURE: no queries, no
// auth reads of its own. The CONFIGURED timeout (`session_timeout_minutes`,
// C-OPS-PORTAL-067) arrives as an optional prop from the ops guard's cached
// read; without it — a teacher wall, or an ops read that never answered — the
// sentence renders WITHOUT a number rather than a wrong one (D-14). A wall
// that only an expired session can see therefore never issues a request that
// an expired (or non-ops) token cannot be answered for.
export function OpsSessionExpiredCard({ timeoutMinutes }: { timeoutMinutes?: number }) {
  const t = useTranslations('Auth');
  const tCapabilities = useTranslations(CAPABILITIES_TRANSLATION_NAMESPACE);

  return (
    <div
      data-slot="ops-session-expired"
      role="alertdialog"
      aria-modal="true"
      aria-label={t('sessionExpired')}
      className="fixed inset-0 z-50 grid place-items-center bg-black/10 p-6 supports-backdrop-filter:backdrop-blur-xs"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-card border border-border bg-card p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-foreground">{t('sessionExpired')}</h2>
        <p className="text-sm text-body">
          {timeoutMinutes === undefined
            ? tCapabilities('sessionExpiredBodyNoTimeout')
            : tCapabilities('sessionExpiredBodyWithTimeout', { minutes: timeoutMinutes })}
        </p>
        <div>
          <Button type="button" href="/sign-in">
            {t('sessionExpiredAction')}
          </Button>
        </div>
      </div>
    </div>
  );
}
