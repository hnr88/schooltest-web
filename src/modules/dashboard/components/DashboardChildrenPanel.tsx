'use client';

import { ArrowRight, Plus, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { AvatarStack, Badge, Button, EmptyState } from '@/modules/design-system';
import { DashboardChildRow } from '@/modules/dashboard/components/DashboardChildRow';
import { FAMILY_AVATAR_LIMIT } from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// The "My children" section (spec 01 §5): a 19px section head with its trailing
// "See details →" over ONE white card at radius 24 whose own vertical padding is
// only 6px — the rows supply the 20px rhythm and the hairlines between them.
export function DashboardChildrenPanel({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');
  const students = overview.recentStudents;

  return (
    <section data-slot="dashboard-profile-roster" aria-labelledby="dashboard-children-title">
      <div
        data-slot="dashboard-family-summary"
        className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2 id="dashboard-children-title" className="text-h4 font-semibold text-foreground">
            {t('familySummaryTitle')}
          </h2>
          {overview.familyAvatars.length > 0 ? (
            <AvatarStack
              entries={overview.familyAvatars}
              max={FAMILY_AVATAR_LIMIT}
              ariaLabel={t('summaryProfilesChip', { count: overview.totalStudents })}
            />
          ) : null}
          {/* These chips sit DIRECTLY on the #EEF2F7 well: bg-muted (#F1F5F9) is
              1.03:1 against it — invisible. They step up to the card white the
              panels use, with the canonical hairline giving them an edge. */}
          <Badge variant="outline" className="border-border bg-card text-body">
            {t('summaryProfilesChip', { count: overview.totalStudents })}
          </Badge>
          <Badge variant="outline" className="border-border bg-card text-body">
            {t('summaryActiveChip', { count: overview.activeStudents })}
          </Badge>
          <Badge variant="outline" className="border-transparent bg-blue-50 text-primary">
            {t('summaryPlansChip', {
              completed: overview.studentsWithEntryPlan,
              total: overview.totalStudents,
            })}
          </Badge>
        </div>
        <Link
          href="/dashboard/children"
          className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-body-sm font-medium text-body transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
        >
          {t('childrenSeeDetails')}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="rounded-card bg-card p-6 shadow-sm">
          <EmptyState
            icon={UsersRound}
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
        <div className="rounded-card bg-card px-4 py-1.5 shadow-sm sm:px-7">
          {students.map((student, index) => (
            <DashboardChildRow
              key={student.documentId}
              student={student}
              last={index === students.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
