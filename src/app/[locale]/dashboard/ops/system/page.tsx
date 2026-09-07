import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsSystemConsole } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.system.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

// Ledger row 5b (msn-0da39441) — the ops System console READ layer
// (C-OPSY-04/06/07/10). The OpsGuard in the section layout keeps this
// ops-only; the routes re-assert it server-side. Mutation controls
// (backup run, cache clear, sitemap, pipeline) are slices 5c/5d.
export default async function OpsSystemPage() {
  const t = await getTranslations('Ops.system');
  return (
    <main
      data-slot="ops-system"
      data-surface="ops-system"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsSystemConsole />
    </main>
  );
}
