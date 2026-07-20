'use client';

import { ArrowLeft, CalendarDays, GraduationCap, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Badge, Button, Eyebrow, PresenceAvatar } from '@/modules/design-system';
import {
  getChildProfileName,
  getChildProfileTarget,
  getChildProfileYear,
} from '@/modules/children/lib/child-profile-display';
import { getInitials, getStatusMeta } from '@/modules/children/lib/student-display';
import type { ChildProgressStudent } from '@/modules/children/types/children.types';

interface ChildProfileHeaderProps {
  student: ChildProgressStudent;
}

export function ChildProfileHeader({ student }: ChildProfileHeaderProps) {
  const t = useTranslations('Children');
  const name = getChildProfileName(student, t('unknownStudent'));
  const status = getStatusMeta(student.status);

  return (
    <header data-slot="child-learning-hero" className="rounded-2xl bg-navy-950 p-6 text-white shadow-lg sm:p-8">
      <Button href="/dashboard/children" variant="outline-white" size="sm" className="mb-6">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('backToList')}
      </Button>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
            <PresenceAvatar
              initials={getInitials(student.given_name ?? '', student.family_name ?? '')}
              size="xl"
            />
            <div className="min-w-0">
              <Eyebrow tone="teal" className="text-teal-300">
                {t('learningDashboardEyebrow')}
              </Eyebrow>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-bold tracking-tight">{name}</h1>
                <Badge className={cn('tracking-wide uppercase', status.className)}>
                  {t(status.labelKey)}
                </Badge>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/80">
                {t('learningDashboardSubtitle')}
              </p>
            </div>
        </div>
        <dl className="grid gap-3 rounded-xl bg-white/10 p-4 text-sm sm:grid-cols-3 lg:min-w-120">
          <div className="flex items-center gap-2 text-blue-100/80">
            <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-teal-300" />
            <div>
              <dt className="text-caption font-semibold">{t('yearLevel')}</dt>
              <dd className="mt-1 font-semibold text-white">
                {getChildProfileYear(student, t('notAvailable'))}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-100/80">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-teal-300" />
            <div>
              <dt className="text-caption font-semibold">{t('targetEntry')}</dt>
              <dd className="mt-1 font-semibold text-white">
                {getChildProfileTarget(student, t('notAvailable'))}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-100/80">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-teal-300" />
            <div>
              <dt className="text-caption font-semibold">{t('nationality')}</dt>
              <dd className="mt-1 font-semibold text-white">{student.nationality ?? t('notAvailable')}</dd>
            </div>
          </div>
        </dl>
      </div>
    </header>
  );
}
