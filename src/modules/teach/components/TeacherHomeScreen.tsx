'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { REPORTS_HREF } from '@/modules/shell';
import { TeachHomeClassCard } from '@/modules/teach/components/TeachHomeClassCard';
import { useTeachHomeQuery } from '@/modules/teach/queries/use-teach-home.query';
import type { TeachHome } from '@/modules/teach/types/teach-home.types';

// Monitor summaries go stale while a sitting runs; poll the landing at this
// cadence only then (mvp-updates §4.9, task 84 step 5).
const MONITOR_POLL_MS = 30_000;

function monitorAwareRefetchInterval(data: TeachHome | undefined): number | false {
  return data?.classes.some((cls) => cls.monitor !== null) ? MONITOR_POLL_MS : false;
}

// Teacher dashboard home (task 84, st-mvp-pivot): the C-TEACH-01 teach-home
// payload (teacher: own classes; school_admin: all school classes) rendered
// as one TeachHomeClassCard per class - diagnostic and monitor summaries plus
// the roster / test day / results links - so every panel is visible from the
// first login, populated or not. The 429 ride-out lives in the shared axios
// interceptor (D-14 M5), so a rate-limited load retries instead of erroring.
export function TeacherHomeScreen() {
  const t = useTranslations('Teach');
  const teachHome = useTeachHomeQuery({ refetchInterval: monitorAwareRefetchInterval });
  const rows = teachHome.data?.classes ?? [];

  return (
    <main
      data-slot="teach-home"
      data-surface="teacher-home"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('home.title')}</h1>
        <p className="max-w-xl text-sm text-body">{t('home.subtitle')}</p>
      </div>
      <section className="flex flex-col gap-3" aria-label={t('home.classesTitle')}>
        <h2 className="text-lg font-semibold text-foreground">{t('home.classesTitle')}</h2>
        {teachHome.isPending ? (
          <p className="text-sm text-muted-foreground">{t('home.classesLoading')}</p>
        ) : null}
        {teachHome.isError ? (
          <p role="alert" className="text-sm text-danger-ink">
            {t('home.classesError')}
          </p>
        ) : null}
        {teachHome.isSuccess && rows.length === 0 ? (
          <p className="max-w-xl text-sm text-body">{t('home.classesEmpty')}</p>
        ) : null}
        {rows.length > 0 ? (
          <ul className="flex max-w-2xl flex-col gap-3">
            {rows.map((row) => (
              <li key={row.documentId}>
                <TeachHomeClassCard classSummary={row} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={REPORTS_HREF}
          className="inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('home.reportsCta')}
        </Link>
        <Link
          href="/dashboard/teach/run-sheet"
          className="inline-flex min-h-11 w-fit items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('home.runSheetLink')}
        </Link>
      </div>
    </main>
  );
}
