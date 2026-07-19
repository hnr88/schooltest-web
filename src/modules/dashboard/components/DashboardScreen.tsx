'use client';

import { useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { DashboardSearch } from '@/modules/dashboard/components/DashboardSearch';
import { StudentsSection } from '@/modules/dashboard/components/StudentsSection';
import { Button } from '@/modules/design-system';

// Dashboard shell (task 15 welcome/sign-out + task 16 real students list +
// task 18 header search bar).
export function DashboardScreen() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const { user, isLoading, logout } = useAuth();

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        {isLoading || !user ? (
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold">{t('welcomeTitle', { name: user.username })}</h1>
              <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={logout}
                className="self-start"
              >
                {tCommon('signOut')}
              </Button>
            </div>
            <DashboardSearch />
            <StudentsSection />
          </>
        )}
      </div>
    </main>
  );
}
