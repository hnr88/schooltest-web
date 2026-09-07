'use client';

import { useTranslations } from 'next-intl';
import { Lock, TriangleAlert } from 'lucide-react';

import { Button } from '@/modules/design-system';
import {
  CAPABILITIES_COPY,
  CAPABILITIES_TRANSLATION_NAMESPACE,
  type CapabilitiesCopyKey,
} from '@/modules/ops/constants/capabilities.constants';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';

const STRIP = 'flex flex-wrap items-center gap-4 rounded-2xl border px-5 py-4';

// The portal's top banner region (mvp/ops/Ops Portal.dc.html:49-66): the
// read-only session strip a support account sees, and the pictured
// "Try again" / "Status page" actions when the server cannot say what this
// account may do. Full ops renders nothing, exactly as the reference does.
export function OpsPortalCapabilities() {
  const t = useTranslations(CAPABILITIES_TRANSLATION_NAMESPACE);
  const copy = (key: CapabilitiesCopyKey): string => (t.has(key) ? t(key) : CAPABILITIES_COPY[key]);
  const query = useCapabilitiesQuery();
  const statusPage = (
    <StatusPageAction
      label={copy('statusPage')}
      unset={copy('statusPageUnset')}
      url={query.data?.status_page_url ?? null}
    />
  );

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

  const data = query.data;
  if (!data || data.capabilities.write) return null;

  return (
    <section
      data-slot="ops-capabilities-read-only"
      data-ops-role={data.actor.role}
      className={`${STRIP} border-border bg-muted`}
    >
      <Lock aria-hidden className="size-5 shrink-0 text-body" />
      <div className="min-w-[220px] flex-1">
        <p className="text-sm font-semibold text-foreground">{copy('readOnlyTitle')}</p>
        <p className="mt-0.5 text-sm text-body">{copy('readOnlyBody')}</p>
      </div>
      {statusPage}
    </section>
  );
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
