import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthSplitLayout, ForgotPasswordCard } from '@/modules/auth';
import { NOINDEX_ROBOTS } from '@/modules/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.forgotMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
    robots: NOINDEX_ROBOTS,
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout>
      <ForgotPasswordCard />
    </AuthSplitLayout>
  );
}
