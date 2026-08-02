import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherNotificationsScreen } from '@/modules/notifications';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Notifications.teacherFeed.meta');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Teacher notification feed page (task 113, st-mvp-pivot; mvp-updates 4.4/4.3):
// the full C-NOT-01 school notification feed the bell's view-all targets. The
// SchoolStaffGuard in this route's layout admits teacher + school_admin
// (D-16a); C-NOT-01 itself scopes rows to the caller.
export default function TeacherNotificationsPage() {
  return <TeacherNotificationsScreen />;
}
