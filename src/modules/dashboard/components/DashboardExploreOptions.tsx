'use client';

import { Building2, Plus, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { DashboardActionLink } from '@/modules/dashboard/components/DashboardActionLink';

export function DashboardExploreOptions() {
  const t = useTranslations('Dashboard');

  return (
    <section
      data-slot="dashboard-action-hub"
      aria-labelledby="dashboard-action-hub-title"
      className="grid grid-cols-1 gap-4 xl:grid-cols-12"
    >
      <div className="flex flex-col gap-2 rounded-panel border border-border bg-card p-5.5 shadow-md xl:col-span-8">
        <div className="flex flex-col gap-1 pb-1">
          <h2
            id="dashboard-action-hub-title"
            className="text-panel-title font-semibold text-foreground"
          >
            {t('exploreTitle')}
          </h2>
          <p className="text-meta text-muted-foreground">{t('exploreSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          <DashboardActionLink
            href="/dashboard/children/new"
            icon={Plus}
            title={t('addStudent')}
            description={t('addStudentDescription')}
          />
          <DashboardActionLink
            href="/dashboard/children"
            icon={UsersRound}
            title={t('viewChildren')}
            description={t('manageProfilesDescription')}
          />
          <DashboardActionLink
            href="/dashboard/search?mode=schools"
            icon={Building2}
            title={t('findSchools')}
            description={t('findSchoolsDescription')}
          />
        </div>
      </div>

      <div className="flex flex-col items-start justify-center gap-2.5 rounded-panel bg-cta-gradient p-5.5 shadow-md xl:col-span-4">
        <p className="text-base font-bold text-white">{t('promoTitle')}</p>
        <p className="text-body-sm text-navy-body">{t('promoDescription')}</p>
        <Button href="/dashboard/search?mode=agents" variant="accent" size="sm" className="mt-1">
          {t('findAgents')}
        </Button>
      </div>
    </section>
  );
}
