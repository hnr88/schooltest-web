'use client';

import { useTranslations } from 'next-intl';

import { ClassResultsStat } from '@/modules/teacher/components/ClassResultsStat';
import { useClassResultsStats } from '@/modules/teacher/hooks/useClassResultsStats';
import type { ClassResultsHeaderProps } from '@/modules/teacher/types/results-shell.types';

// .qa/DESIGN.md §Results — class detail: the class name is the page's h1, the
// roster size sits under it, and the four summary stats come from C-TR-1's
// `summary`. The trail "Dashboard / Results / <class>" is the app's ONE
// breadcrumb in the topbar; the class name reaches it through the shell's own
// useRecordCrumb (see ClassResultsScreen), so no second breadcrumb is added here.
function ClassResultsHeader({ className, studentCount, summary }: ClassResultsHeaderProps) {
  const t = useTranslations('Teacher.results.detail');
  const stats = useClassResultsStats(summary);

  return (
    <header data-slot="class-results-header" className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-portal-title font-bold break-words text-foreground">{className}</h1>
        <p className="text-meta text-muted-foreground">{t('students', { count: studentCount })}</p>
      </div>

      {/*
        A named REGION around the list, not `aria-label` on the <dl> itself: `dl`
        has no corresponding ARIA role, so a name put directly on it is not
        reliably exposed (measured — Chrome reports it as DescriptionList and the
        accessibility tree carried no name). The section is the nameable element;
        the <dl>/<dt>/<dd> stay the semantics of the four label/value pairs.
      */}
      <section aria-labelledby="class-summary-heading">
        <h2 id="class-summary-heading" className="sr-only">
          {t('summaryLabel')}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <ClassResultsStat key={item.key} item={item} />
          ))}
        </dl>
      </section>
    </header>
  );
}

export { ClassResultsHeader };
