import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ChildrenScreen } from '@/modules/children';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Children.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// C-UI-MYCHILDREN: parent auth gate lives in the dashboard layout (task 012) — no
// per-page guard. The screen reads the ownership-scoped C-STUDENT-LIST-EXT list.
export default function ChildrenPage() {
  return <ChildrenScreen />;
}
