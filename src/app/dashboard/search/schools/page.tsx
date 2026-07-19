import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolSearchScreen } from '@/modules/school-search';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolSearch.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The parent auth gate lives in the dashboard layout (task 012) — this page
// mounts the School search screen only; the layout guards every /dashboard/*
// once (C-UI-SHELL ParentGuard). The client boundary stays inside the module.
export default function SchoolSearchPage() {
  return <SchoolSearchScreen />;
}
