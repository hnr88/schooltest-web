'use client';

import { ArrowRight, Plus, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PresenceAvatar,
} from '@/modules/design-system';
import { getStudentInitials, hasEntryPlan } from '@/modules/dashboard/lib/dashboard-overview';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardRecentProfiles({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');

  return (
    <section
      data-slot="dashboard-recent-profiles"
      aria-labelledby="dashboard-recent-profiles-title"
    >
      <Card className="h-full border-border shadow-sm">
        <CardHeader>
          <CardTitle id="dashboard-recent-profiles-title" role="heading" aria-level={2}>
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
        <CardContent className="flex flex-col gap-1">
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
            overview.recentStudents.map((student) => {
              const entryPlanReady = hasEntryPlan(student);

              return (
                <article
                  key={student.documentId}
                  data-slot="dashboard-recent-profile"
                  className="flex flex-wrap items-center gap-3 rounded-lg p-3 transition-colors duration-200 ease-out-expo hover:bg-muted/70 motion-reduce:transition-none sm:flex-nowrap"
                >
                  <PresenceAvatar initials={getStudentInitials(student)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {student.given_name} {student.family_name}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {t('addedOn', {
                        date: format.dateTime(new Date(student.createdAt), { dateStyle: 'medium' }),
                      })}
                    </p>
                  </div>
                  <Badge variant={entryPlanReady ? 'success' : 'warning'} className="shrink-0">
                    {entryPlanReady ? t('entryPlanSet') : t('entryPlanMissing')}
                  </Badge>
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}
