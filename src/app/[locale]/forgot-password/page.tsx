import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthCenteredLayout, ForgotPasswordCard } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.forgotMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthCenteredLayout>
      <ForgotPasswordCard />
    </AuthCenteredLayout>
  );
}
