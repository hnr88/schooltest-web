import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { env } from '@/lib/env';

const googleSans = localFont({
  src: [
    {
      path: '../app/fonts/GoogleSans-Variable.ttf',
      weight: '400 800',
      style: 'normal',
    },
    {
      path: '../app/fonts/GoogleSans-Italic-Variable.ttf',
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
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
