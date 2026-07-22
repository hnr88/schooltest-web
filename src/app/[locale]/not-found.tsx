import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

// Full-page 404 (design spec 06 §3.1): an oversized blue-100 "404" with the navy
// magnifier badge sunk into its baseline, headline + body, then the primary /
// secondary action pair.
export default function NotFound() {
  const t = useTranslations('Common');

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex max-w-lg animate-in flex-col items-center gap-5 text-center duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
        <p
          role="img"
          aria-label="404"
          className="relative text-9xl leading-none font-bold tracking-tighter text-blue-100 select-none"
        >
          404
          <span
            aria-hidden="true"
            className="absolute bottom-3.5 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-2xl bg-navy-900 text-accent-on-dark shadow-lg"
          >
            <Search className="size-7" />
          </span>
        </p>
        <div className="flex flex-col gap-2">
          <h1 className="text-auth-title font-bold text-foreground">{t('notFoundTitle')}</h1>
          <p className="text-body-lg text-muted-foreground">{t('notFoundDescription')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            href="/"
            size="lg"
            className="rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {t('backToDashboard')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            href="mailto:support@schooltest.app"
            className="rounded-lg font-semibold text-navy-800 transition-[transform,background-color,border-color] duration-150 ease-out-expo hover:-translate-y-0.5 hover:border-slate-400 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {t('reportProblem')}
          </Button>
        </div>
      </div>
    </main>
  );
}
