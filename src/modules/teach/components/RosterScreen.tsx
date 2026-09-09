'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { RosterTable } from '@/modules/teach/components/RosterTable';
import { useClassRosterQuery } from '@/modules/teach/queries/use-class-roster.query';

import type { RosterScreenProps } from '@/modules/teach/types/components.types';

// Teacher roster screen (task 63, mvp-updates §4.4): the read-only class
// roster ahead of test day. An unowned class yields an empty page from
// C-CHD-01 (teacher scoping), which the kit renders as its empty state —
// never an error and never another teacher's students. ops/33: loading,
// empty, error, search, filter and sort all belong to the shared directory
// kit now, so this screen keeps only the page header and the hint.
export function RosterScreen({ documentId }: RosterScreenProps) {
  const t = useTranslations('Teach.roster');
  const roster = useClassRosterQuery(documentId);
  const rows = roster.data ?? [];
  const className = rows.find((row) => row.class)?.class?.name ?? null;
  const hasMissingEmail = rows.some((row) => !row.email);

  return (
    <main
      data-slot="teach-roster"
      data-surface="teacher-roster"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/teach"
          className="w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('backLink')}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{className ?? t('title')}</h1>
        <p className="max-w-xl text-sm text-body">{t('subtitle')}</p>
        <Link
          href={`/dashboard/teach/classes/${documentId}/test-day`}
          className="inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('testDayLink')}
        </Link>
      </div>
      <RosterTable rows={rows} query={roster} />
      {hasMissingEmail ? (
        <p className="max-w-xl text-sm text-body">{t('emailMissingHint')}</p>
      ) : null}
    </main>
  );
}
