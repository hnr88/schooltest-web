import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { GoogleCallbackScreen } from '@/modules/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.googleCallbackMeta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

interface GoogleCallbackPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// C-AUTH-GOOGLE (D18): the browser lands here straight from Google's consent
// redirect, with Google's own tokens in the query (access_token, id_token,
// raw[...]). searchParams is read here (Server Component) and rebuilt into a
// verbatim query string, which GoogleCallbackScreen forwards to
// GET /api/auth/google/callback — the real Strapi session jwt comes only from
// that response, never from the query's id_token (Google's OIDC token).
export default async function GoogleCallbackPage({ searchParams }: GoogleCallbackPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) query.append(key, entry);
    } else if (value !== undefined) {
      query.append(key, value);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <GoogleCallbackScreen queryString={query.toString()} />
    </main>
  );
}
