'use client';

import { ArrowLeft, CalendarDays, GraduationCap, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Badge, Button, PresenceAvatar } from '@/modules/design-system';
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
    <header className="flex flex-col gap-5">
      <div>
        <Button href="/dashboard/children" variant="outline" size="sm" className="h-11 px-4">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('backToList')}
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <PresenceAvatar
              initials={getInitials(student.given_name ?? '', student.family_name ?? '')}
              size="xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-foreground">{name}</h1>
                <Badge className={cn('tracking-wide uppercase', status.className)}>
                  {t(status.labelKey)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('profileSubtitle')}</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:min-w-56">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-blue-600" />
              <dt className="sr-only">{t('yearLevel')}</dt>
              <dd className="text-foreground">{getChildProfileYear(student, t('notAvailable'))}</dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
              <dt className="sr-only">{t('targetEntry')}</dt>
              <dd className="text-foreground">
                {getChildProfileTarget(student, t('notAvailable'))}
              </dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin aria-hidden="true" className="text-navy-700 size-4 shrink-0" />
              <dt className="sr-only">{t('nationality')}</dt>
              <dd className="text-foreground">{student.nationality ?? t('notAvailable')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}
