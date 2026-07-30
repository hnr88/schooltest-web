'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/modules/design-system';
import { RosterTable } from '@/modules/teach/components/RosterTable';
import { useClassRosterQuery } from '@/modules/teach/queries/use-class-roster.query';

interface RosterScreenProps {
  documentId: string;
}

// Teacher roster screen (task 63, mvp-updates §4.4): the read-only class
// roster ahead of test day. An unowned class yields an empty page from
// C-CHD-01 (teacher scoping), which renders as the empty state — never an
// error and never another teacher's students.
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
      {roster.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {roster.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}
      {roster.isSuccess && rows.length === 0 ? (
        <EmptyState icon={Users} title={t('emptyTitle')} description={t('emptyBody')} />
      ) : null}
      {roster.isSuccess && rows.length > 0 ? (
        <>
          <RosterTable rows={rows} />
          {hasMissingEmail ? (
            <p className="max-w-xl text-sm text-body">{t('emailMissingHint')}</p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
