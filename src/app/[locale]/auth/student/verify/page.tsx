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

interface StudentVerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Web fallback for the student magic-link email (C-ML-VERIFY): the emailed link
// lands here with ?token=<64hex> when the schooltest:// deep link has no app to
// open. The Server Component reduces searchParams to the bare token string and
// the client screen claims it — the token is never rendered or logged.
export default async function StudentVerifyPage({ searchParams }: StudentVerifyPageProps) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <MagicLinkVerifyScreen variant="student" token={token} />
    </main>
  );
}
