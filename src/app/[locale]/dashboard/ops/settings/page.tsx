import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsPlatformSettings } from '@/modules/ops';

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
    </main>
  );
}
