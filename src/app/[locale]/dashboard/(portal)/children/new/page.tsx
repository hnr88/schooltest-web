import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { WizardScreen } from '@/modules/student-wizard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('StudentWizard.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// C-UI-STUDENT-WIZARD: parent auth gate lives in the dashboard layout
// (task 012) — no per-page guard. The wizard shell holds its own RHF state.
export default function NewChildPage() {
  return <WizardScreen />;
}
