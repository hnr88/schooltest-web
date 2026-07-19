'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { DashboardSearch } from '@/modules/dashboard/components/DashboardSearch';
import { StudentsSection } from '@/modules/dashboard/components/StudentsSection';
import { Button } from '@/modules/design-system';

// Overview content (C-UI-SHELL §12.3, task 012): full-width content area with
// greeting header left and a right-aligned primary "Add student" link to
// /dashboard/children/new; search + students below (table's canonical home
// moves to /dashboard/children in W9).
export function DashboardScreen() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <main className="flex flex-1 flex-col px-8 py-7">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
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
      <DashboardSearch />
      <StudentsSection />
    </main>
  );
}
