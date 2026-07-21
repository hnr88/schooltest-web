'use client';

import { ArrowRight, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/modules/design-system';
import { DashboardProfileRosterItem } from '@/modules/dashboard/components/DashboardProfileRosterItem';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardRecentProfiles({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');

  return (
    <section
      data-slot="dashboard-profile-roster"
      aria-labelledby="dashboard-profile-roster-title"
    >
      <Card className="h-full rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle id="dashboard-profile-roster-title" role="heading" aria-level={2}>
            {t('recentProfilesTitle')}
          </CardTitle>
          <CardDescription>{t('recentProfilesSubtitle')}</CardDescription>
          <CardAction>
            <Button href="/dashboard/children" variant="outline" size="sm">
              {t('viewChildren')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {overview.recentStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('recentProfilesEmptyTitle')}
              description={t('recentProfilesEmptySubtitle')}
              action={
                <Button href="/dashboard/children/new" size="sm">
                  <Plus aria-hidden="true" className="size-4" />
                  {t('addStudent')}
                </Button>
              }
              className="border-0 bg-muted/50 p-8"
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {overview.recentStudents.map((student) => (
                <DashboardProfileRosterItem key={student.documentId} student={student} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
