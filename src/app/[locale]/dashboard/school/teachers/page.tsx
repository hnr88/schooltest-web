import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeachersScreen } from '@/modules/teachers';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teachers.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// School admin Teachers page (task 23, st-mvp-pivot): staff accounts + open
// invitations with invite/reissue/revoke/deactivate actions. The
// SchoolAdminGuard in the section layout keeps this school_admin-only.
export default function SchoolTeachersPage() {
  return <TeachersScreen />;
}
