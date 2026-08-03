'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { usePathname } from '@/i18n/navigation';
import { Button } from '@/modules/design-system';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations('Common');
  // This boundary is shared by public and private routes. Offering "Back to
  // dashboard" to an anonymous visitor whose privacy policy failed to load is a
  // dead end — the CTA follows the route the error happened on.
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-9 text-center">
        <span
          aria-hidden="true"
          className="flex size-9.5 items-center justify-center rounded-xl bg-red-50 text-destructive dark:bg-red-950/40"
        >
          <CircleAlert className="size-4.5" />
        </span>
        <h1 className="mt-4 text-base font-semibold">{t('error')}</h1>
        <p className="mt-1.5 max-w-75 text-sm text-muted-foreground">{t('errorDescription')}</p>
        {error.digest ? (
          <p className="mt-2 text-xs text-muted-foreground">#{error.digest}</p>
        ) : null}
        <div className="mt-4.5 flex gap-2.5">
          <Button onClick={() => unstable_retry()}>{t('retry')}</Button>
          <Button variant="outline" href={isDashboard ? '/dashboard' : '/'}>
            {isDashboard ? t('backToDashboard') : t('backToHome')}
          </Button>
        </div>
      </div>
    </main>
  );
}
