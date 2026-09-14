import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { MagicLinkVerifyScreen } from '@/modules/auth-verify';
import { NOINDEX_ROBOTS } from '@/modules/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('MagicLink.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
    robots: NOINDEX_ROBOTS,
  };
}

interface TeacherVerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Web fallback for the teacher trial sign-in email (C-TT-VERIFY): same shape as
// the student page — ?token=<64hex> in the query, claimed once by the client
// screen (which POSTs it to the API's body-shaped teacher endpoint).
export default async function TeacherVerifyPage({ searchParams }: TeacherVerifyPageProps) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <MagicLinkVerifyScreen variant="teacher" token={token} />
    </main>
  );
}
