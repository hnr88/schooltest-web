import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ForgotPasswordCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.forgotMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Minimal top-centered layout outside the landing chrome (§14.3): logo lockup
// at the top, card below. The card component owns the authed redirect.
export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pt-11 pb-16">
      <ForgotPasswordCard />
    </main>
  );
}
