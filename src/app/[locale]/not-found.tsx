import { useTranslations } from 'next-intl';

import { Button, Logo } from '@/modules/design-system';

export default function NotFound() {
  const t = useTranslations('Common');

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-9 text-center">
        <p
          role="img"
          aria-label="404"
          className="flex items-center gap-3 text-error-code font-bold text-foreground"
        >
          4<Logo variant="mark" alt="" height={52} />4
        </p>
        <h1 className="mt-4 text-base font-semibold">{t('notFoundTitle')}</h1>
        <p className="mt-1.5 max-w-75 text-sm text-muted-foreground">{t('notFoundDescription')}</p>
        <div className="mt-4.5 flex gap-2.5">
          <Button href="/">{t('backToDashboard')}</Button>
          <Button variant="outline" href="mailto:support@schooltest.app">
            {t('reportProblem')}
          </Button>
        </div>
      </div>
    </main>
  );
}
