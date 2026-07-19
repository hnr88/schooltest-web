import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SignInCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string }>;
}

// Minimal centered layout — outside the landing chrome (no header/footer). The
// card's logo lockup is the page's logo link home (DS sign-in card structure).
// ?error=google (C-AUTH-GOOGLE, D18) arrives from /auth/google/callback when the
// forwarded query is absent or the api rejects it — surfaced as the card's alert.
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <SignInCard hasGoogleError={error === 'google'} />
      </div>
    </main>
  );
}
