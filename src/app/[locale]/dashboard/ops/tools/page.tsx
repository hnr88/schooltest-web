import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { OpsFormInspection, OpsRawExport, OpsViewAsTeacher } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.tools.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Ops tools page (task 70, st-mvp-pivot, C-OPS-04): form inspection, raw
// response export and view-as-teacher. The OpsGuard in the section layout
// keeps this ops-only.
export default async function OpsToolsPage() {
  const t = await getTranslations('Ops.tools');
  return (
    <main
      data-slot="ops-tools"
      data-surface="ops-tools"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/ops/schools"
          className="w-fit text-sm text-body underline-offset-4 hover:underline"
        >
          {t('backToSchools')}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsFormInspection />
      <OpsRawExport />
      <OpsViewAsTeacher />
    </main>
  );
}
