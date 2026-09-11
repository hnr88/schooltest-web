'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
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
//
// "Sign in again" ends the dead session before it navigates: the axios boundary
// clears only the STORED token, so the store still holds it and /sign-in would
// bounce that token straight back to /dashboard and this wall, in a loop.
export function OpsSessionExpiredCard({ timeoutMinutes }: { timeoutMinutes?: number }) {
  const t = useTranslations('Auth');
  const tCapabilities = useTranslations(CAPABILITIES_TRANSLATION_NAMESPACE);
  const setToken = useAuthStore((state) => state.setToken);

  return (
    <div
      data-slot="ops-session-expired"
      role="alertdialog"
      aria-modal="true"
      aria-label={t('sessionExpired')}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(14,35,80,0.72)] p-6 backdrop-blur-[3px]"
    >
      <div className="w-[420px] max-w-full rounded-[24px] bg-white p-8 text-center shadow-[0_28px_56px_rgba(0,0,0,0.28)]">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-[16px] bg-[#EEF3FE] text-[#2563EB]">
          <Clock aria-hidden className="size-[22px]" />
        </div>
        <h2 className="text-[19px] font-semibold text-[#0E2350]">{t('sessionExpired')}</h2>
        <p className="mt-2.5 text-sm leading-[1.6] text-[#64748B]">
          {timeoutMinutes === undefined
            ? tCapabilities('sessionExpiredBodyNoTimeout')
            : tCapabilities('sessionExpiredBodyWithTimeout', { minutes: timeoutMinutes })}
        </p>
        <Button
          type="button"
          href="/sign-in"
          onClick={() => setToken(null)}
          className="mt-[22px] h-[46px] w-full rounded-full bg-[#0E2350] text-sm font-semibold text-white hover:bg-[#16326E]"
        >
          {t('sessionExpiredAction')}
        </Button>
      </div>
    </div>
  );
}
