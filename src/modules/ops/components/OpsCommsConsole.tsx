'use client';

import { useTranslations } from 'next-intl';

import { OpsBroadcastComposer } from './OpsBroadcastComposer';
import { OpsCommsTemplates } from './OpsCommsTemplates';
import { OpsEmailLogTable } from './OpsEmailLogTable';

// C-OPSM-01/03/04/05 (ledger 7) — the ops Comms console.
//
// Reads first, then the two write surfaces: an operator should see what the
// platform already sends (the event registry) and what it has issued (the auth
// email ledger) before composing a fan-out of their own.
//
// Each read owns its loading and error state — one spinner over the whole
// screen would hide a working half.
export function OpsCommsConsole() {
  const t = useTranslations('Ops.comms');

  return (
    <div data-slot="ops-comms-console" className="flex flex-col gap-8">
      <OpsCommsTemplates />
      <OpsEmailLogTable />
      <section data-slot="ops-comms-composers" className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">{t('composersTitle')}</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <OpsBroadcastComposer variant="email" />
          <OpsBroadcastComposer variant="push" />
        </div>
      </section>
    </div>
  );
}
