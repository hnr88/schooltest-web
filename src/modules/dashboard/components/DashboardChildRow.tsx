'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { AvatarTint, getAvatarTone } from '@/modules/design-system';
import { DashboardReadinessRail } from '@/modules/dashboard/components/DashboardReadinessRail';
import {
  getDashboardEntryPlan,
  getDashboardYearLabel,
  getReadinessFields,
} from '@/modules/dashboard/lib/dashboard-overview';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

interface DashboardChildRowProps {
  student: StudentListRow;
  last: boolean;
}

// One "My children" row (spec 01 §5): 44px avatar · 190px name block · the
// readiness rail on the flexible middle · a pill · a chevron, all on a 20px
// vertical rhythm behind a hairline that the last row drops.
//
// The design makes the whole row a `div onClick`. It ships here as one real
// anchor so it is reachable by keyboard and announces as a link; the design
// declares no hover and no focus state at all, so both are authored: a tinted
// hover bed plus a nudged chevron, and a visible --ring focus ring.
export function DashboardChildRow({ student, last }: DashboardChildRowProps) {
  const t = useTranslations('Dashboard');
  const name = getStudentDisplayName(student, t('unknownProfile'));
  const fields = getReadinessFields(student);
  const filled = fields.filter((field) => field.filled).length;
  const entryPlan = getDashboardEntryPlan(student);
  const yearLabel = getDashboardYearLabel(student, (level) => t('yearLevelOption', { level }));
  const meta = [yearLabel, student.nationality].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/dashboard/children/${student.documentId}`}
      aria-label={t('childRowLabel', { name, filled, total: fields.length })}
      className={cn(
        'group -mx-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3.5 rounded-tile px-3 py-5 transition-colors duration-200 ease-out-expo hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none motion-reduce:transition-none sm:flex sm:gap-5',
        last ? null : 'border-b border-divider',
      )}
    >
      <AvatarTint
        initials={getStudentInitials(student)}
        size="md"
        tone={getAvatarTone(student.documentId)}
      />
      <span className="flex min-w-0 flex-col sm:w-47.5 sm:flex-none">
        <span className="truncate text-button font-semibold text-foreground">{name}</span>
        <span className="mt-0.5 truncate text-meta text-body">
          {meta === '' ? t('profileMetaMissing') : meta}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none sm:order-last"
      />
      <span className="col-span-3 flex min-w-0 items-center gap-4 sm:contents">
        <DashboardReadinessRail fields={fields} />
        <span
          className={cn(
            'flex-none rounded-full px-3.25 py-1.5 text-meta font-semibold',
            entryPlan === null
              ? 'bg-warning-soft text-warning-ink'
              : 'bg-blue-50 text-primary',
          )}
        >
          {entryPlan === null ? t('childRowPlanNeeded') : t('childRowPlan', { plan: entryPlan })}
        </span>
      </span>
    </Link>
  );
}
