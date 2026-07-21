'use client';

import { Building2, Handshake, Plus, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/design-system';
import { DashboardActionLink } from '@/modules/dashboard/components/DashboardActionLink';

export function DashboardExploreOptions() {
  const t = useTranslations('Dashboard');

  return (
    <section
      data-slot="dashboard-action-hub"
      aria-labelledby="dashboard-action-hub-title"
    >
      <Card className="h-full rounded-2xl border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle id="dashboard-action-hub-title" role="heading" aria-level={2}>
            {t('exploreTitle')}
          </CardTitle>
          <CardDescription>{t('exploreSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
          <DashboardActionLink
            href="/dashboard/search?mode=agents"
            icon={Handshake}
            title={t('findAgents')}
            description={t('findAgentsDescription')}
          />
        </CardContent>
      </Card>
    </section>
  );
}
