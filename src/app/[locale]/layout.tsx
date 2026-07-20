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
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'Schooltest',
    template: '%s · Schooltest',
  },
  description: 'Schooltest web application.',
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Schooltest',
    description: 'Schooltest web application.',
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
