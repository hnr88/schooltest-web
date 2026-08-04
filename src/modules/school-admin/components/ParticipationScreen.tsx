'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ParticipationClassRow } from '@/modules/school-admin/components/ParticipationClassRow';
import { useParticipationQuery } from '@/modules/school-admin/queries/use-participation.query';

// School participation monitor (task 78, mvp spec 4.3): the admin's main
// operational screen - which classes have completed Test A and Test B, as
// completion status only (chasing who still needs to sit), never results.
// A school with no classes gets the honest empty state.
export function ParticipationScreen() {
  const t = useTranslations('SchoolAdmin.participation');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const query = useParticipationQuery(hydrated && Boolean(token));

  if (query.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={query.isFetching}
              onClick={() => query.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      </main>
    );
  }

  const { classes } = query.data;

  return (
    <main
      data-slot="school-participation"
      data-surface="school-admin-participation"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="max-w-xl text-sm text-body">{t('subtitle')}</p>
      </div>

      {classes.length === 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-6">
          <h2 className="text-lg font-semibold text-foreground">{t('emptyTitle')}</h2>
          <p className="max-w-xl text-sm text-body">{t('emptyDescription')}</p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-3xl border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-body">
                  {t('columns.class')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-body">
                  {t('columns.teacher')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-body">
                  {t('columns.roster')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-body">
                  {t('columns.testA')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-body">
                  {t('columns.testB')}
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((row) => (
                <ParticipationClassRow key={row.documentId} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
