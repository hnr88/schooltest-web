'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations('Common');

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
          <Button variant="outline" href="/">
            {t('backToDashboard')}
          </Button>
        </div>
      </div>
    </main>
  );
}
