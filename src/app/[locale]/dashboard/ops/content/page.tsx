import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsContentConsole } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.content.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

// Ledger row 8 (msn-0da39441) — the ops Content console (C-OPSC-01..06).
// The OpsGuard in the section layout keeps this ops-only; the routes
// re-assert it server-side. Every maintenance action honours the server's
// dry-run-first contract and executes only behind an explicit confirmation.
export default async function OpsContentPage() {
  const t = await getTranslations('Ops.content');
  return (
    <main
      data-slot="ops-content"
      data-surface="ops-content"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsContentConsole />
    </main>
  );
}
