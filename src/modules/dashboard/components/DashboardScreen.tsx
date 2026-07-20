'use client';

import { ChevronRight, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { useStudentsQuery } from '@/modules/dashboard/queries/use-students.query';
import { Button, Skeleton } from '@/modules/design-system';

// Overview content (C-UI-SHELL §12.3): greeting header + a right-aligned primary
// "Add student" link to the wizard, and a "My children" card that links to the
// relocated children table at /dashboard/children (D-UI-1 / C-UI-MYCHILDREN —
// the list + add-student dialog no longer live on the Overview).
export function DashboardScreen() {
  const t = useTranslations('Dashboard');
  const { user, isLoading } = useAuth();
  const { data } = useStudentsQuery();
  const count = data?.data.length ?? 0;

  if (isLoading || !user) {
    // D-UI-2: loading is skeleton shimmer (animate-pulse via the Skeleton
    // primitive) mirroring the header + content blocks, never bare text.
    return (
      <main className="flex flex-1 flex-col gap-8 px-8 py-7">
        <div aria-hidden="true" className="flex flex-col gap-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    );
  }

  return (
    // Entrance is transform-only (no fade): an opacity ramp makes axe's
    // color-contrast scan time-sensitive for everything inside main.
    <main className="flex flex-1 flex-col gap-8 px-8 py-7 duration-300 ease-out animate-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">
            {t('welcomeTitle', { name: user.username })}
          </h1>
          <p className="text-sm text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>
        <Button href="/dashboard/children/new">
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors duration-200 ease-out hover:border-input motion-reduce:transition-none">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-navy-800 dark:bg-blue-950 dark:text-blue-300"
          >
            <Users className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-semibold text-muted-foreground">
                {count}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <Button href="/dashboard/children" variant="outline" className="self-start">
          {t('viewChildren')}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </section>
    </main>
  );
}
