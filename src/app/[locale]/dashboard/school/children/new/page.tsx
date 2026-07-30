import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolChildNewScreen } from '@/modules/school-children';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolChildren.newMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Add-child page (task 30, st-mvp-pivot): the reshaped school form (C-CHD-02)
// — guardian and media steps from the parent wizard are not part of the
// school flow. The SchoolAdminGuard in the section layout gates the page.
export default function SchoolNewChildPage() {
  return <SchoolChildNewScreen />;
}
