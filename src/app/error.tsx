'use client';

import { useTranslations } from 'next-intl';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations('Common');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">{t('error')}</h1>
      {error.digest ? <p className="text-xs text-muted-foreground">#{error.digest}</p> : null}
      <button
        onClick={() => unstable_retry()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {t('retry')}
      </button>
    </main>
  );
}
