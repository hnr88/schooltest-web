'use client';

import { ArrowRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { StatusPill } from '@/modules/design-system';
import { ChildCardMetric } from '@/modules/children/components/ChildCardMetric';
import { ChildrenRowActions } from '@/modules/children/components/ChildrenRowActions';
import { getChildCardMeta, getChildCardMetrics } from '@/modules/children/lib/child-card';
import { getStatusMeta, getStatusTone } from '@/modules/children/lib/student-display';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildCardProps {
  student: StudentListRow;
}

// §A.5 ChildCard — r24 white card, 28px padding, 22px stack: identity row (52px
// avatar · name · meta · trailing pill), the hairline-topped MetricStrip, then the
// footer line. The whole card is the click target, but through a STRETCHED LINK
// (`after:inset-0`) rather than a div onClick, so it keeps link semantics, a real
// focus ring and middle-click.
export function ChildCard({ student }: ChildCardProps) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');
  const format = useFormatter();
  const name = getStudentDisplayName(student, t('unknownStudent'));
  const status = getStatusMeta(student.status);
  const meta = getChildCardMeta(student);
  const metrics = getChildCardMetrics(student, {
    formatYear: (year) => tWizard('education.yearOption', { n: year }),
    yearLevel: t('columnYearLevel'),
    targetEntry: t('columnTargetEntry'),
  });

  return (
    <article
      aria-label={t('childCardLabel', { name })}
      data-slot="child-card"
      className="group relative flex w-full min-w-0 animate-in flex-col gap-5.5 rounded-card bg-card p-6 shadow-sm transition duration-300 ease-out-expo fade-in slide-in-from-bottom-3 hover:-translate-y-0.5 hover:shadow-lg has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-card motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-7"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          aria-hidden="true"
          className="grid size-13 shrink-0 place-items-center rounded-full bg-divider text-h4 font-semibold text-foreground"
        >
          {getStudentInitials(student)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* The truncation lives on the INNER span: `overflow-hidden` on the link
              itself would clip the ::after that stretches it over the whole card. */}
          <Link
            href={`/dashboard/children/${student.documentId}`}
            aria-label={t('viewProfileLabel', { name })}
            className="text-h4 font-semibold text-foreground transition-colors duration-200 ease-out-expo group-hover:text-primary after:absolute after:inset-0 after:rounded-card focus-visible:outline-none motion-reduce:transition-none"
          >
            <span className="block truncate">{name}</span>
          </Link>
          {meta ? (
            <span className="truncate text-caption text-muted-foreground">{meta}</span>
          ) : null}
        </div>
        <StatusPill tone={getStatusTone(student.status)} className="shrink-0">
          {t(status.labelKey)}
        </StatusPill>
        <div className="relative z-10 shrink-0">
          <ChildrenRowActions student={student} />
        </div>
      </div>

      <dl className="flex min-w-0 gap-3 border-t border-divider pt-5 sm:gap-4.5">
        {metrics.map((metric, cell) => (
          <ChildCardMetric key={metric.label} metric={metric} divided={cell > 0} />
        ))}
      </dl>

      <div className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
        {/* The design's note line is a generated sentence about the weakest skill
            (B-10). Replaced by a fact the list read actually carries. */}
        <span className="min-w-0 truncate">
          {t('cardAdded', {
            date: format.dateTime(new Date(student.createdAt), {
              month: 'short',
              year: 'numeric',
            }),
          })}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary"
        >
          {t('cardDetails')}
          <ArrowRight className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </span>
      </div>
    </article>
  );
}
