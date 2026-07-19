import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ResetPasswordCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.resetMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ code?: string }>;
}

// Minimal top-centered layout outside the landing chrome (§14.3 reuse). The
// emailed link lands here with ?code=<128-hex>; a missing/empty code renders
// the invalid-link state immediately, without an API call (C-UI-AUTH-PAGES).
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { code } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center px-6 pt-11 pb-16">
      <ResetPasswordCard code={code} />
    </main>
  );
}
