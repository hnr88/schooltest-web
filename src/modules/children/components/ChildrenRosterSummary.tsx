'use client';

import { Archive, Plus, UsersRound } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button, Eyebrow } from '@/modules/design-system';

function ChildrenRosterSummary({
  activeCount,
  archivedCount,
  totalCount,
}: {
  activeCount: number;
  archivedCount: number;
  totalCount: number;
}) {
  const format = useFormatter();
  const t = useTranslations('Children');

  return (
    <header
      data-slot="children-roster-summary"
      className="flex flex-col gap-6 rounded-2xl bg-navy-950 p-6 text-white shadow-lg sm:p-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <Eyebrow tone="teal" className="text-teal-300">
            {t('rosterEyebrow')}
          </Eyebrow>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('heading')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{t('rosterDescription')}</p>
        </div>
        <Button href="/dashboard/children/new" variant="white" size="lg" className="shrink-0">
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      </div>
      <dl
        aria-label={t('rosterSummaryLabel')}
        className="grid gap-3 sm:grid-cols-3"
      >
        <div className="rounded-xl bg-white/10 p-4">
          <dt className="flex items-center gap-2 text-sm text-blue-100/80">
            <UsersRound aria-hidden="true" className="size-4 text-teal-300" />
            {t('rosterActive')}
          </dt>
          <dd className="mt-2 text-2xl font-bold">{format.number(activeCount)}</dd>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <dt className="flex items-center gap-2 text-sm text-blue-100/80">
            <Archive aria-hidden="true" className="size-4 text-teal-300" />
            {t('rosterArchived')}
          </dt>
          <dd className="mt-2 text-2xl font-bold">{format.number(archivedCount)}</dd>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <dt className="flex items-center gap-2 text-sm text-blue-100/80">
            <UsersRound aria-hidden="true" className="size-4 text-teal-300" />
            {t('rosterTotal')}
          </dt>
          <dd className="mt-2 text-2xl font-bold">{format.number(totalCount)}</dd>
        </div>
      </dl>
    </header>
  );
}

export { ChildrenRosterSummary };
