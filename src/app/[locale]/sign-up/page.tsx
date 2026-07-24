import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthSplitLayout, SignUpCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.signUpMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default function SignUpPage() {
  return (
    <AuthSplitLayout>
      <SignUpCard />
    </AuthSplitLayout>
  );
}
