import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

import '../globals.css';
import { Providers } from '@/modules/providers';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Seo' });
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    // The brand is `SchoolTest` (see SITE_NAME) — the lowercase `Schooltest` here
    // disagreed with `og:site_name` and the generated card on every page.
    title: {
      default: SITE_NAME,
      template: `%s · ${SITE_NAME}`,
    },
    description: t('siteDescription'),
    openGraph: {
      type: 'website',
      url: '/',
      title: SITE_NAME,
      description: t('siteDescription'),
    },
  };
}

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
        {/*
          Ops Portal.dc.html:843-849 — bottom-center pill toast: 999px radius,
          13px 16px 13px 24px padding, 13.5px/500, capped at min(620px, 80vw),
          navy shadow. Restyled at the mount site only; ui/sonner.tsx is
          read-only, and its defaults are fully replaced by these props.
        */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast:
                '!rounded-full !py-[13px] !pl-6 !pr-4 !text-[13.5px] !font-medium !max-w-[min(620px,80vw)] !shadow-[0_12px_32px_rgba(14,35,80,0.28)]',
              actionButton:
                '!h-8 !rounded-full !bg-white/15 !border !border-white/30 !px-3.5 !text-[13px] !font-semibold !text-white',
            },
          }}
        />
      </body>
    </html>
  );
}
