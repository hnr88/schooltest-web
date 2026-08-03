import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthSplitLayout, ResetPasswordCard } from '@/modules/auth';
import { NOINDEX_ROBOTS } from '@/modules/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.resetMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
    robots: NOINDEX_ROBOTS,
  };
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { code } = await searchParams;

  return (
    <AuthSplitLayout>
      <ResetPasswordCard code={code} />
    </AuthSplitLayout>
  );
}
