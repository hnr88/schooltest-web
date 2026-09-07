import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsCommsConsole } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.comms.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

// Ledger row 7 (msn-0da39441) — the ops Comms console (C-OPSM-01/03/04/05).
// The OpsGuard in the section layout keeps this ops-only; the four routes
// re-assert it server-side with `global::is-ops`.
export default async function OpsCommsPage() {
  const t = await getTranslations('Ops.comms');
  return (
    <main
      data-slot="ops-comms"
      data-surface="ops-comms"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsCommsConsole />
    </main>
  );
}
