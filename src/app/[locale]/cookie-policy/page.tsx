import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LegalDocumentScreen, getLegalDocument } from '@/modules/legal';
import { buildPageMetadata } from '@/modules/seo';

const SLUG = 'cookie-policy' as const;
const PATHNAME = '/cookie-policy' as const;

interface CookiePolicyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CookiePolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const document = await getLegalDocument(SLUG, locale);
  if (!document) return {};
  return buildPageMetadata({
    title: document.title,
    description: document.summary ?? document.title,
    pathname: PATHNAME,
    locale,
  });
}

// C-LEG-02 public legal page. A Server Component: the document is fetched on
// the server and rendered as typed data, so no legal copy ever ships in a
// client bundle and none is hardcoded in the repo.
export default async function CookiePolicyPage({ params }: CookiePolicyPageProps) {
  const { locale } = await params;
  const document = await getLegalDocument(SLUG, locale);
  if (!document) notFound();

  return <LegalDocumentScreen document={document} pathname={PATHNAME} locale={locale} />;
}
