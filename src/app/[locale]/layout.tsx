import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import '../globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { isLocale } from '@/i18n/routing';
import { env } from '@/lib/env';
import { SITE_NAME } from '@/modules/seo';

const googleSans = localFont({
  src: [
    {
      path: '../fonts/GoogleSans-Variable.ttf',
      weight: '400 800',
      style: 'normal',
    },
    {
      path: '../fonts/GoogleSans-Italic-Variable.ttf',
      weight: '400 800',
      style: 'italic',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  // The brand is `SchoolTest` (see SITE_NAME) — the lowercase `Schooltest` here
  // disagreed with `og:site_name` and the generated card on every page.
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: 'Diagnostic English assessment for Australian EAL/D classrooms.',
  openGraph: {
    type: 'website',
    url: '/',
    title: SITE_NAME,
    description: 'Diagnostic English assessment for Australian EAL/D classrooms.',
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${googleSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
