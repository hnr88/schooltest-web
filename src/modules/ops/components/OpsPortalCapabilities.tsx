'use client';

import { useTranslations } from 'next-intl';
import { Lock, TriangleAlert, WifiOff } from 'lucide-react';

import { Button } from '@/modules/design-system';
import {
  CAPABILITIES_COPY,
  CAPABILITIES_TRANSLATION_NAMESPACE,
  type CapabilitiesCopyKey,
} from '@/modules/ops/constants/capabilities.constants';
import { useOnlineStatus } from '@/modules/ops/hooks/use-online-status';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';

// Ops Portal.dc.html:51-66 — 16px radius, 14px 18px padding, spec hexes.
const STRIP = 'flex flex-wrap items-center gap-3.5 rounded-[16px] border px-[18px] py-[14px]';

const RETRY_CLASS =
  'inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#B42318] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#9a1d14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

// The portal's top banner region (mvp/ops/Ops Portal.dc.html:49-66): the
// offline strip (:51-58), the read-only session strip a support account sees,
// and the pictured "Try again" / "Status page" actions when the server cannot
// say what this account may do. Full ops renders nothing, exactly as the
// reference does.
//
// One region, one strip: precedence is offline > read-only > capabilities
// error, so a session is never told two things in two places. The offline
// strip and the action kit's offline write gate (task 03) read the ONE
// useOnlineStatus listener, so the banner and the refusal cannot disagree.
export function OpsPortalCapabilities() {
  const t = useTranslations(CAPABILITIES_TRANSLATION_NAMESPACE);
  const copy = (key: CapabilitiesCopyKey): string => (t.has(key) ? t(key) : CAPABILITIES_COPY[key]);
  const query = useCapabilitiesQuery();
  const online = useOnlineStatus();
  const statusPage = (
    <StatusPageAction
      label={copy('statusPage')}
      unset={copy('statusPageUnset')}
      url={query.data?.status_page_url ?? null}
    />
  );

  if (!online) {
    return (
      <section
        data-slot="ops-offline-strip"
        className={`${STRIP} border-[#F3C6C1] bg-[#FDEEEC]`}
      >
        <WifiOff aria-hidden className="size-[18px] shrink-0 text-[#B42318]" />
        <div className="min-w-[220px] flex-1">
          <p className="text-[13.5px] font-semibold text-[#B42318]">{copy('offlineTitle')}</p>
          <p className="mt-0.5 text-[13px] text-[#7A2E28]">{copy('offlineBody')}</p>
        </div>
        <button
          type="button"
          data-slot="ops-offline-retry"
          className={RETRY_CLASS}
          onClick={() => void query.refetch()}
        >
          {copy('offlineRetry')}
        </button>
      </section>
    );
  }

  const data = query.data;
  if (data && !data.capabilities.write) {
    return (
      <section
        data-slot="ops-capabilities-read-only"
        data-ops-role={data.actor.role}
        className={`${STRIP} border-[#DFE5EE] bg-[#F1F3F7]`}
      >
        <Lock aria-hidden className="size-[18px] shrink-0 text-[#3D4A5C]" />
        <div className="min-w-[220px] flex-1">
          <p className="text-[13.5px] font-semibold text-[#0E2350]">{copy('readOnlyTitle')}</p>
          <p className="mt-0.5 text-[13px] text-[#7C8698]">{copy('readOnlyBody')}</p>
        </div>
        {statusPage}
      </section>
    );
  }

  if (query.isError) {
    return (
      <section
        data-slot="ops-capabilities-error"
        className={`${STRIP} border-destructive/25 bg-destructive/8`}
      >
        <TriangleAlert aria-hidden className="size-5 shrink-0 text-destructive" />
        <div className="min-w-[220px] flex-1">
          <p className="text-sm font-semibold text-destructive">{copy('errorTitle')}</p>
          <p className="mt-0.5 text-sm text-body">{copy('errorBody')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="navy"
          data-slot="ops-capabilities-retry"
          onClick={() => void query.refetch()}
        >
          {copy('retry')}
        </Button>
        {statusPage}
      </section>
    );
  }

  return null;
}

const ACTION_CLASS =
  'inline-flex h-9 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * The pictured "Status page" control. When the release configured no URL the
 * control is still RENDERED — disabled, naming the missing configuration —
 * because hiding it would sign off visual parity on an unfinished release step.
 * A plain anchor, not the design-system `href` Button: that one routes through
 * next-intl and would locale-prefix an external absolute URL.
 */
function StatusPageAction({ label, unset, url }: { label: string; unset: string; url: string | null }) {
  if (!url) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title={unset}
        data-slot="ops-status-page"
        data-status-page="unset"
        className={`${ACTION_CLASS} cursor-not-allowed opacity-60`}
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-slot="ops-status-page"
      data-status-page="configured"
      className={ACTION_CLASS}
    >
      {label}
    </a>
  );
}
