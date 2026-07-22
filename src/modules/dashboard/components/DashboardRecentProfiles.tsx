'use client';

import { ArrowRight, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button, DataGridHeadRow, DataPanel, EmptyState } from '@/modules/design-system';
import { DashboardProfileRosterItem } from '@/modules/dashboard/components/DashboardProfileRosterItem';
import {
  INSET_HEAD_ROW,
  PANEL_ELEVATION,
} from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardRecentProfiles({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');
  const students = overview.recentStudents;

  return (
    <section
      data-slot="dashboard-profile-roster"
      aria-labelledby="dashboard-profile-roster-title"
      className="h-full"
    >
      <DataPanel className={cn('flex h-full flex-col', PANEL_ELEVATION)}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
          <h2
            id="dashboard-profile-roster-title"
            className="text-panel-title font-semibold text-foreground"
          >
            {t('recentProfilesTitle')}
          </h2>
          <Link
            href="/dashboard/children"
            className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
          >
            {t('allProfiles')}
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={Users}
              title={t('recentProfilesEmptyTitle')}
              description={t('recentProfilesEmptySubtitle')}
              action={
                <Button href="/dashboard/children/new" size="sm">
                  <Plus aria-hidden="true" className="size-4" />
                  {t('addFirstStudent')}
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <DataGridHeadRow className={cn('hidden grid-cols-profile-row md:grid', INSET_HEAD_ROW)}>
              <span>{t('rosterColumnProfile')}</span>
              <span>{t('profileCurrentYear')}</span>
              <span>{t('profileTargetEntry')}</span>
              <span>{t('columnAdded')}</span>
              <span className="sr-only">{t('rosterColumnAction')}</span>
            </DataGridHeadRow>
            {students.map((student, index) => (
              <DashboardProfileRosterItem
                key={student.documentId}
                student={student}
                last={index === students.length - 1}
              />
            ))}
          </>
        )}
      </DataPanel>
    </section>
  );
}
