'use client';

import { ArrowRight, CalendarDays, GraduationCap, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Badge, Card, CardContent, CardFooter, PresenceAvatar } from '@/modules/design-system';
import { ChildrenRowActions } from '@/modules/children/components/ChildrenRowActions';
import {
  getInitials,
  getStatusMeta,
  getTargetEntry,
  getYearLevelLabel,
} from '@/modules/children/lib/student-display';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildCardProps {
  student: StudentListRow;
}

export function ChildCard({ student }: ChildCardProps) {
  const t = useTranslations('Children');
  const name = `${student.given_name} ${student.family_name}`;
  const status = getStatusMeta(student.status);
  const yearLevel = getYearLevelLabel(student) ?? t('notAvailable');
  const targetEntry = getTargetEntry(student) ?? t('notAvailable');

  return (
    <article aria-label={t('childCardLabel', { name })}>
      <Card className="h-full gap-4 border-border bg-card shadow-sm transition-shadow duration-150 ease-out hover:shadow-md motion-reduce:transition-none">
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <PresenceAvatar
                initials={getInitials(student.given_name, student.family_name)}
                size="lg"
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-foreground">{name}</h2>
                <p className="truncate text-sm text-muted-foreground">
                  {student.nationality ?? t('notAvailable')}
                </p>
              </div>
            </div>
            <Badge className={cn('shrink-0 tracking-wide uppercase', status.className)}>
              {t(status.labelKey)}
            </Badge>
          </div>

          <dl className="grid gap-3 border-y border-border py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-blue-600" />
              <dt className="sr-only">{t('yearLevel')}</dt>
              <dd className="text-foreground">{yearLevel}</dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
              <dt className="sr-only">{t('targetEntry')}</dt>
              <dd className="text-foreground">{targetEntry}</dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin aria-hidden="true" className="text-navy-700 size-4 shrink-0" />
              <dt className="sr-only">{t('nationality')}</dt>
              <dd className="text-foreground">{student.nationality ?? t('notAvailable')}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="mt-auto justify-between gap-3">
          <Link
            href={`/dashboard/children/${student.documentId}`}
            aria-label={t('viewProfileLabel', { name })}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary transition-colors duration-150 ease-out hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none dark:hover:bg-blue-950"
          >
            {t('viewProfile')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <ChildrenRowActions student={student} />
        </CardFooter>
      </Card>
    </article>
  );
}
