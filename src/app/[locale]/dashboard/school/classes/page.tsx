import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ClassesScreen } from '@/modules/classes';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Classes.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// School admin Classes page (task 29, st-mvp-pivot): the C-CLS-01 roster with
// create/edit/delete against C-CLS-02/03/04. The SchoolAdminGuard in the
// section layout keeps this school_admin-only.
export default function SchoolClassesPage() {
  return <ClassesScreen />;
}
