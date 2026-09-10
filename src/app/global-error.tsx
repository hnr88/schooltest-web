'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';

import { isLocale, routing, type Locale } from '@/i18n/routing';

import './globals.css';

// Replaces the root layout when it throws, so next-intl's server provider is
// not available here. The locale lives only in the URL prefix (routing has no
// cookie and no detection), so it is read from the address bar and the matching
// catalogue is lazily loaded — the same per-locale dynamic import i18n/request
// uses. Until it arrives the screen is blank rather than English-only, so no
// hardcoded copy ever renders.
function localeFromLocation(): Locale {
  if (typeof window === 'undefined') return routing.defaultLocale;
  const first = window.location.pathname.split('/').find((segment) => segment !== '') ?? '';
  return isLocale(first) ? first : routing.defaultLocale;
}

function GlobalErrorBody({ digest, onRetry }: { digest?: string; onRetry: () => void }) {
  const t = useTranslations('Common');
  return (
    <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-9 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- global-error replaces the root layout; next/image is unavailable here */}
      <img src="/brand/logo-mark.png" alt="" className="h-13 w-auto opacity-80" />
      <h1 className="mt-4 text-base font-semibold">{t('error')}</h1>
      <p className="mt-1.5 max-w-75 text-sm text-muted-foreground">
        {t('errorDescription')}
      </p>
      {digest ? (
        <p className="mt-2 text-xs text-muted-foreground">#{digest}</p>
      ) : null}
      <button
        onClick={onRetry}
        className="mt-4.5 h-10 rounded-lg bg-primary px-4.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        {t('retry')}
      </button>
    </div>
  );
}

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [locale] = useState(localeFromLocation);
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import(`@/i18n/messages/${locale}.json`).then((module) => {
      if (!cancelled) setMessages(module.default as Record<string, unknown>);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
        {messages === null ? null : (
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GlobalErrorBody digest={error.digest} onRetry={() => unstable_retry()} />
          </NextIntlClientProvider>
        )}
      </body>
    </html>
  );
}
