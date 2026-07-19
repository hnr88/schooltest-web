import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthSplitLayout, SignInCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string; confirmed?: string }>;
}

// §14.1 split-panel layout (C-UI-AUTH-PAGES) — navy brand panel ≥1024px, the
// centered card alone below. The card's logo lockup stays the page's logo link
// home. ?error=google (C-AUTH-GOOGLE, D18) arrives from /auth/google/callback
// when the forwarded query is absent or the api rejects it — surfaced as the
// card's alert. ?confirmed=1 (C-AUTH-CONFIRM redirect target) renders the
// email-confirmed success strip above the form.
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, confirmed } = await searchParams;

  return (
    <AuthSplitLayout>
      <SignInCard hasGoogleError={error === 'google'} showConfirmedBanner={confirmed === '1'} />
    </AuthSplitLayout>
  );
}
