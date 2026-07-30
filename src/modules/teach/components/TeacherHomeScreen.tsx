'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useSchoolClassesQuery } from '@/modules/classes';
import { REPORTS_HREF } from '@/modules/shell';

// Teacher dashboard home (task 27, st-mvp-pivot): the teacher's own classes
// (C-CLS-01 is teacher-scoped server-side) each linking to the task-63 roster,
// plus the teacher report surface (task 25). W7 builds the full teacher
// dashboard here.
export function TeacherHomeScreen() {
  const t = useTranslations('Teach');
  const classes = useSchoolClassesQuery(true);
  const rows = classes.data ?? [];

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
        {classes.isPending ? (
          <p className="text-sm text-muted-foreground">{t('home.classesLoading')}</p>
        ) : null}
        {classes.isSuccess && rows.length === 0 ? (
          <p className="max-w-xl text-sm text-body">{t('home.classesEmpty')}</p>
        ) : null}
        {rows.length > 0 ? (
          <ul className="flex max-w-xl flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.documentId}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground">{row.name}</span>
                <span className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/teach/classes/${row.documentId}/test-day`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {t('home.testDayLink')}
                  </Link>
                  <Link
                    href={`/dashboard/teach/classes/${row.documentId}`}
                    className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {t('home.rosterLink')}
                  </Link>
                </span>
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
