import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsPlatformSettings } from '@/modules/ops';
// Direct file import, not the ops barrel: that barrel is mid-edit by another
// worker on the shared staging checkout, and a one-console export is not worth
// a collision there.
import { OpsLegalDocumentEditor } from '@/modules/ops/components/OpsLegalDocumentEditor';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.settings.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

// C-SET-02/03/04 platform settings (task 226). The OpsGuard in the section
// layout keeps this ops-only; the routes re-assert it server-side.
export default async function OpsSettingsPage() {
  const t = await getTranslations('Ops.settings');
  return (
    <main
      data-slot="ops-settings"
      data-surface="ops-settings"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsPlatformSettings />
      {/* Ledger 10 (D-008): the legal-document editor shares the settings
          screen — it edits PUBLIC pages, which is a settings concern, and it
          owns its own form so it sits beside, not inside, the platform form. */}
      <OpsLegalDocumentEditor />
    </main>
  );
}
