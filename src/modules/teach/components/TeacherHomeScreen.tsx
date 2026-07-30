'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { REPORTS_HREF } from '@/modules/shell';

// Teacher dashboard home (task 27, st-mvp-pivot): thin but real — it points at
// the teacher report surface that already exists (task 25). W7 builds the full
// teacher dashboard here.
export function TeacherHomeScreen() {
  const t = useTranslations('Teach');

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
      <Link
        href={REPORTS_HREF}
        className="inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {t('home.reportsCta')}
      </Link>
    </main>
  );
}
