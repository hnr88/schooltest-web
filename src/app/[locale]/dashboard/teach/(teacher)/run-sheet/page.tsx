import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { RunSheetScreen } from '@/modules/test-day';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('RunSheet.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Test-day run sheet (task 65, st-mvp-pivot; mvp-updates §4.5 step 4): a
// static, printable guide for the sitting, linked from the test-day screen
// and teacher home. The TeacherGuard in the teach layout keeps it
// teacher-only; it is not per-class, so the roster link points back to the
// teacher's class list.
export default function RunSheetPage() {
  return <RunSheetScreen />;
}
