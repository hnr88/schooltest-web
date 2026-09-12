'use client';

import { useLocale, useTranslations } from 'next-intl';

import { dayFirstDate } from '@/modules/teacher/lib/v2/family-reports';

/**
 * "Sitting <class>" · "Latest average" · "Last session" (`mFacts`), all from live
 * reads. `lastSessionAt` is undefined while its read is in flight ("—"), null
 * when the class has none ("None yet").
 */
function FactsRow({
  className,
  studentCount,
  average,
  lastSessionAt,
}: {
  className: string;
  studentCount: number;
  average: number | null;
  lastSessionAt: string | null | undefined;
}) {
  const t = useTranslations('TeacherPortal.startSession.facts');
  const tKit = useTranslations('TeacherPortal.kit');
  const locale = useLocale();
  // "31 Aug" (`:2602`) — the day before the month, in the reader's own locale (P1 parity row 8).
  // `opened_at` is an instant, so it reads in the teacher's own zone, not UTC.
  const lastSession =
    lastSessionAt === undefined
      ? tKit('noValue')
      : lastSessionAt === null
        ? t('noneYet')
        : dayFirstDate(locale, lastSessionAt, { day: '2-digit', month: 'short' });
  const facts = [
    { key: 'sitting', label: t('sitting', { className }), value: t('students', { count: studentCount }) },
    { key: 'average', label: t('latestAverage'), value: average === null ? t('notTested') : t('average', { value: average }) },
    { key: 'last', label: t('lastSession'), value: lastSession },
  ];

  return (
    <dl data-slot="start-session-facts" className="mt-5 flex flex-wrap gap-3.5">
      {facts.map((fact) => (
        <div key={fact.key} data-fact={fact.key} className="min-w-0 flex-[1_1_150px] rounded-[10px] bg-[#FAFBFC] px-[18px] py-4">
          <dt className="text-[11.5px] font-semibold tracking-[0.05em] text-[#6B7280] uppercase">{fact.label}</dt>
          <dd className="mt-1.5 text-[15px] font-semibold text-navy-900">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export { FactsRow };
