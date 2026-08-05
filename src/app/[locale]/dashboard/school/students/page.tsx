import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolStudentsScreen } from '@/modules/school-students';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolStudents.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// School admin Students page (task 30, st-mvp-pivot): the C-CHD-01 roster with
// filters and pagination, plus edit/archive against C-CHD-03/04. The
// SchoolAdminGuard in the section layout keeps this school_admin-only.
export default function SchoolStudentsPage() {
  return <SchoolStudentsScreen />;
}
