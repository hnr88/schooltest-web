import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SignUpCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.signUpMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Minimal centered layout — outside the landing chrome (no header/footer),
// sibling of /sign-in (D10). The card's logo lockup is the page's logo link home.
export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <SignUpCard />
      </div>
    </main>
  );
}
