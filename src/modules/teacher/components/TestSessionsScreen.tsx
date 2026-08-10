import { ClipboardList } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { TeacherPagePlaceholder } from '@/modules/teacher/components/TeacherPagePlaceholder';

// /dashboard/test-sessions — the destination behind the teacher rail's "Test
// sessions" entry. Setup, join code and live monitoring ship in tasks 034-038.
export async function TestSessionsScreen() {
  const t = await getTranslations('Teacher.testSessions');

  return (
    <TeacherPagePlaceholder
      surface="teacher-test-sessions"
      icon={ClipboardList}
      title={t('title')}
      description={t('description')}
      placeholderTitle={t('placeholderTitle')}
      placeholderDescription={t('placeholderDescription')}
    />
  );
}
