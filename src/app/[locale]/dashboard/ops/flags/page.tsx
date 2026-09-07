import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsFlagsConsole } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.flags.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

// Ledger row 9 (msn-0da39441) — the ops Flags console (C-OPSF-01..05).
// The OpsGuard in the section layout keeps this ops-only; the five routes
// re-assert it server-side with `global::is-ops`.
export default async function OpsFlagsPage() {
  const t = await getTranslations('Ops.flags');
  return (
    <main
      data-slot="ops-flags"
      data-surface="ops-flags"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsFlagsConsole />
    </main>
  );
}
